package com.stockup.backend.service.impl;

import com.stockup.backend.dto.PurchaseOrderRequest;
import com.stockup.backend.dto.PurchaseOrderResponse;
import com.stockup.backend.dto.PurchaseOrderSummaryDTO;
import com.stockup.backend.exception.ResourceNotFoundException;
import com.stockup.backend.model.Item;
import com.stockup.backend.model.PurchaseOrder;
import com.stockup.backend.model.PurchaseOrderStatus;
import com.stockup.backend.model.Supplier;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.repository.PurchaseOrderRepository;
import com.stockup.backend.repository.SupplierRepository;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ItemRepository itemRepository;
    private final SupplierRepository supplierRepository;
    private final CurrentUserService currentUserService;

    @Override
    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request) {
        log.info("Creating purchase order: itemCode={}, supplierName={}, qty={}",
                request.getItemCode(), request.getSupplierName(), request.getQuantityOrdered());

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber(generateUniquePoNumber());
        po.setQuantityOrdered(request.getQuantityOrdered());
        po.setUnitPrice(request.getUnitPrice());
        po.setTotalAmount(request.getQuantityOrdered() * request.getUnitPrice());
        po.setPriority(request.getPriority() != null && !request.getPriority().isBlank() ? request.getPriority() : "Medium");
        po.setNotes(request.getNotes());
        po.setExpectedDeliveryDate(request.getExpectedDeliveryDate());

        if (po.getBusinessId() == null || po.getBusinessId().isBlank()) {
            currentUserService.getCurrentUserBusinessIdOptional().ifPresent(po::setBusinessId);
        }

        // Parse status (default SUBMITTED)
        PurchaseOrderStatus status = parseStatus(request.getStatus(), PurchaseOrderStatus.SUBMITTED);
        po.setStatus(status);

        // Resolve Item details if available
        resolveItemDetails(po, request);

        // Resolve Supplier details if available
        resolveSupplierDetails(po, request);

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Successfully created purchase order {} (id={}) with status {}",
                saved.getPoNumber(), saved.getId(), saved.getStatus());
        return mapToResponse(saved);
    }

    @Override
    public List<PurchaseOrderResponse> getAllPurchaseOrders() {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        List<PurchaseOrder> list = bOpt.isPresent()
                ? purchaseOrderRepository.findByBusinessIdOrderByCreatedAtDesc(bOpt.get())
                : purchaseOrderRepository.findAllByOrderByCreatedAtDesc();
        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PurchaseOrderResponse> getPurchaseOrdersByStatus(String statusStr) {
        PurchaseOrderStatus status = parseStatus(statusStr, null);
        if (status == null) {
            return getAllPurchaseOrders();
        }
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        List<PurchaseOrder> list = bOpt.isPresent()
                ? purchaseOrderRepository.findByBusinessIdAndStatusOrderByCreatedAtDesc(bOpt.get(), status)
                : purchaseOrderRepository.findByStatusOrderByCreatedAtDesc(status);
        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PurchaseOrderResponse getPurchaseOrderById(String id) {
        PurchaseOrder po = findPoByIdOrNumber(id);
        return mapToResponse(po);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse updateStatus(String id, String newStatusStr) {
        PurchaseOrder po = findPoByIdOrNumber(id);
        PurchaseOrderStatus newStatus = parseStatus(newStatusStr, null);
        if (newStatus == null) {
            throw new IllegalArgumentException("Invalid status: " + newStatusStr);
        }

        if (newStatus == PurchaseOrderStatus.RECEIVED && po.getStatus() != PurchaseOrderStatus.RECEIVED) {
            // Route through full receive logic to update warehouse inventory
            return receivePurchaseOrder(id);
        }

        po.setStatus(newStatus);
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Updated PO {} status to {}", saved.getPoNumber(), saved.getStatus());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse receivePurchaseOrder(String id) {
        PurchaseOrder po = findPoByIdOrNumber(id);

        if (po.getStatus() == PurchaseOrderStatus.RECEIVED) {
            log.warn("PO {} is already received/fulfilled at {}", po.getPoNumber(), po.getReceivedAt());
            throw new IllegalStateException("Purchase order " + po.getPoNumber() + " has already been received and fulfilled.");
        }

        log.info("Fulfilling Purchase Order {}: adding {} units to inventory for item={}",
                po.getPoNumber(), po.getQuantityOrdered(), po.getItemCode() != null ? po.getItemCode() : po.getItemName());

        // 1. Transactionally find and update Item stock
        Item item = findAssociatedItem(po);
        if (item != null) {
            int oldQty = item.getQuantity() != null ? item.getQuantity() : 0;
            int orderQty = po.getQuantityOrdered() != null ? po.getQuantityOrdered() : 0;
            int newQty = oldQty + orderQty;
            item.setQuantity(newQty);

            // Recalculate item stock status
            if (newQty > 50) {
                item.setStatus("In Stock");
            } else if (newQty > 0) {
                item.setStatus("Low Stock");
            } else {
                item.setStatus("Out of Stock");
            }

            itemRepository.save(item);
            log.info("Warehouse inventory incremented for item {} (NDC: {}): oldQty={}, newQty={}, newStatus={}",
                    item.getName(), item.getCode(), oldQty, newQty, item.getStatus());
        } else {
            log.warn("No matching Item record found in database for PO {}. Stock level not incremented.", po.getPoNumber());
        }

        // 2. Increment supplier fulfilled orders count if linked
        if (po.getSupplierId() != null) {
            supplierRepository.findById(po.getSupplierId()).ifPresent(sup -> {
                int currentFulfilled = sup.getFulfilledOrders() != null ? sup.getFulfilledOrders() : 0;
                sup.setFulfilledOrders(currentFulfilled + 1);
                supplierRepository.save(sup);
            });
        }

        // 3. Mark PO as RECEIVED with current timestamp
        po.setStatus(PurchaseOrderStatus.RECEIVED);
        po.setReceivedAt(LocalDateTime.now());
        PurchaseOrder updatedPo = purchaseOrderRepository.save(po);

        log.info("Purchase Order {} successfully fulfilled and marked as RECEIVED.", updatedPo.getPoNumber());
        return mapToResponse(updatedPo);
    }

    @Override
    @Transactional
    public void deletePurchaseOrder(String id) {
        PurchaseOrder po = findPoByIdOrNumber(id);
        purchaseOrderRepository.delete(po);
        log.info("Deleted purchase order {}", po.getPoNumber());
    }

    @Override
    public PurchaseOrderSummaryDTO getSummary() {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        List<PurchaseOrder> all = bOpt.isPresent()
                ? purchaseOrderRepository.findByBusinessIdOrderByCreatedAtDesc(bOpt.get())
                : purchaseOrderRepository.findAll();
        long totalOrders = all.size();
        long submittedOrders = all.stream().filter(p -> p.getStatus() == PurchaseOrderStatus.SUBMITTED).count();
        long receivedOrders = all.stream().filter(p -> p.getStatus() == PurchaseOrderStatus.RECEIVED).count();
        long draftOrders = all.stream().filter(p -> p.getStatus() == PurchaseOrderStatus.DRAFT).count();
        long cancelledOrders = all.stream().filter(p -> p.getStatus() == PurchaseOrderStatus.CANCELLED).count();
        double totalSpend = all.stream()
                .filter(p -> p.getStatus() == PurchaseOrderStatus.RECEIVED)
                .mapToDouble(p -> p.getTotalAmount() != null ? p.getTotalAmount() : 0.0)
                .sum();

        return PurchaseOrderSummaryDTO.builder()
                .totalOrders(totalOrders)
                .submittedOrders(submittedOrders)
                .receivedOrders(receivedOrders)
                .draftOrders(draftOrders)
                .cancelledOrders(cancelledOrders)
                .totalSpend(totalSpend)
                .build();
    }

    // ── Helper methods ─────────────────────────────────────────────────────────

    private PurchaseOrder findPoByIdOrNumber(String identifier) {
        Optional<PurchaseOrder> existingOpt = purchaseOrderRepository.findById(identifier)
                .or(() -> purchaseOrderRepository.findByPoNumber(identifier));

        if (existingOpt.isEmpty()) {
            throw new ResourceNotFoundException("Purchase order not found with ID or PO number: " + identifier);
        }

        PurchaseOrder po = existingOpt.get();
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        if (bOpt.isPresent() && po.getBusinessId() != null && !po.getBusinessId().equals(bOpt.get())) {
            throw new AccessDeniedException("Access denied: Purchase Order belongs to another company");
        }
        return po;
    }

    private Item findAssociatedItem(PurchaseOrder po) {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        String bId = bOpt.orElse(po.getBusinessId());

        if (po.getItemId() != null && !po.getItemId().isBlank()) {
            Optional<Item> byId = bId != null
                    ? itemRepository.findByIdAndBusinessId(po.getItemId(), bId)
                    : itemRepository.findById(po.getItemId());
            if (byId.isPresent()) return byId.get();
        }
        if (po.getItemCode() != null && !po.getItemCode().isBlank()) {
            Optional<Item> byCode = bId != null
                    ? itemRepository.findByCodeIgnoreCaseAndBusinessId(po.getItemCode().trim(), bId)
                    : itemRepository.findByCodeIgnoreCase(po.getItemCode().trim());
            if (byCode.isPresent()) return byCode.get();
        }
        if (po.getItemName() != null && !po.getItemName().isBlank()) {
            String name = po.getItemName().trim();
            Optional<Item> byName = bId != null
                    ? itemRepository.findFirstByNameIgnoreCaseAndBusinessId(name, bId)
                    : itemRepository.findFirstByNameIgnoreCase(name);
            if (byName.isPresent()) return byName.get();
        }
        return null;
    }

    private void resolveItemDetails(PurchaseOrder po, PurchaseOrderRequest request) {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        String bId = bOpt.orElse(null);
        Item item = null;

        if (request.getItemId() != null && !request.getItemId().isBlank()) {
            item = bId != null
                    ? itemRepository.findByIdAndBusinessId(request.getItemId(), bId).orElse(null)
                    : itemRepository.findById(request.getItemId()).orElse(null);
        }
        if (item == null && request.getItemCode() != null && !request.getItemCode().isBlank()) {
            item = bId != null
                    ? itemRepository.findByCodeIgnoreCaseAndBusinessId(request.getItemCode().trim(), bId).orElse(null)
                    : itemRepository.findByCodeIgnoreCase(request.getItemCode().trim()).orElse(null);
        }
        if (item == null && request.getItemName() != null && !request.getItemName().isBlank()) {
            item = bId != null
                    ? itemRepository.findFirstByNameIgnoreCaseAndBusinessId(request.getItemName().trim(), bId).orElse(null)
                    : itemRepository.findFirstByNameIgnoreCase(request.getItemName().trim()).orElse(null);
        }

        if (item != null) {
            po.setItemId(item.getId());
            po.setItemCode(item.getCode());
            po.setItemName(item.getName());
            if (po.getBusinessId() == null) {
                po.setBusinessId(item.getBusinessId());
            }
        } else {
            po.setItemId(request.getItemId());
            po.setItemCode(request.getItemCode());
            po.setItemName(request.getItemName());
        }
    }

    private void resolveSupplierDetails(PurchaseOrder po, PurchaseOrderRequest request) {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        String bId = bOpt.orElse(null);

        if (request.getSupplierId() != null && !request.getSupplierId().isBlank()) {
            Optional<Supplier> sup = bId != null
                    ? supplierRepository.findByIdAndBusinessId(request.getSupplierId(), bId)
                    : supplierRepository.findById(request.getSupplierId());
            if (sup.isPresent()) {
                po.setSupplierId(sup.get().getId());
                po.setSupplierName(sup.get().getName());
                return;
            }
        }
        if (request.getSupplierName() != null && !request.getSupplierName().isBlank()) {
            Optional<Supplier> sup = bId != null
                    ? supplierRepository.findByNameIgnoreCaseAndBusinessId(request.getSupplierName().trim(), bId)
                    : supplierRepository.findByNameIgnoreCase(request.getSupplierName().trim());
            if (sup.isPresent()) {
                po.setSupplierId(sup.get().getId());
                po.setSupplierName(sup.get().getName());
                return;
            }
        }
        po.setSupplierId(request.getSupplierId());
        po.setSupplierName(request.getSupplierName());
    }

    private String generateUniquePoNumber() {
        int year = Year.now().getValue();
        for (int attempt = 0; attempt < 10; attempt++) {
            int seq = ThreadLocalRandom.current().nextInt(1000, 9999);
            String candidate = String.format("PO-%d-%04d", year, seq);
            if (purchaseOrderRepository.findByPoNumber(candidate).isEmpty()) {
                return candidate;
            }
        }
        return String.format("PO-%d-%d", year, System.currentTimeMillis() % 100000);
    }

    private PurchaseOrderStatus parseStatus(String statusStr, PurchaseOrderStatus defaultStatus) {
        if (statusStr == null || statusStr.isBlank()) {
            return defaultStatus;
        }
        String clean = statusStr.trim().toUpperCase();
        switch (clean) {
            case "DRAFT":
                return PurchaseOrderStatus.DRAFT;
            case "SUBMITTED":
            case "PENDING":
                return PurchaseOrderStatus.SUBMITTED;
            case "RECEIVED":
            case "COMPLETED":
            case "FULFILLED":
                return PurchaseOrderStatus.RECEIVED;
            case "CANCELLED":
            case "REJECTED":
                return PurchaseOrderStatus.CANCELLED;
            default:
                try {
                    return PurchaseOrderStatus.valueOf(clean);
                } catch (IllegalArgumentException e) {
                    return defaultStatus;
                }
        }
    }

    private PurchaseOrderResponse mapToResponse(PurchaseOrder po) {
        return PurchaseOrderResponse.builder()
                .id(po.getId())
                .poNumber(po.getPoNumber())
                .itemId(po.getItemId())
                .itemCode(po.getItemCode())
                .itemName(po.getItemName())
                .supplierId(po.getSupplierId())
                .supplierName(po.getSupplierName())
                .quantityOrdered(po.getQuantityOrdered())
                .unitPrice(po.getUnitPrice())
                .totalAmount(po.getTotalAmount())
                .priority(po.getPriority())
                .notes(po.getNotes())
                .status(po.getStatus() != null ? po.getStatus().name() : "SUBMITTED")
                .expectedDeliveryDate(po.getExpectedDeliveryDate())
                .createdAt(po.getCreatedAt())
                .receivedAt(po.getReceivedAt())
                .build();
    }
}
