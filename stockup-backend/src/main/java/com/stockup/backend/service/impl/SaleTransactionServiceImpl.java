package com.stockup.backend.service.impl;

import com.stockup.backend.dto.billing.CreateSaleRequestDTO;
import com.stockup.backend.dto.billing.InvoiceDTO;
import com.stockup.backend.dto.billing.SaleResponseDTO;
import com.stockup.backend.exception.InsufficientStockException;
import com.stockup.backend.exception.ResourceNotFoundException;
import com.stockup.backend.model.Business;
import com.stockup.backend.model.Item;
import com.stockup.backend.model.SaleTransaction;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.repository.SaleTransactionRepository;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.service.SaleTransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SaleTransactionServiceImpl implements SaleTransactionService {

    public static final int LOW_STOCK_THRESHOLD = 50;

    private final ItemRepository itemRepository;
    private final SaleTransactionRepository saleTransactionRepository;
    private final BusinessRepository businessRepository;
    private final CurrentUserService currentUserService;

    public SaleTransactionServiceImpl(
            ItemRepository itemRepository,
            SaleTransactionRepository saleTransactionRepository,
            BusinessRepository businessRepository,
            CurrentUserService currentUserService) {
        this.itemRepository = itemRepository;
        this.saleTransactionRepository = saleTransactionRepository;
        this.businessRepository = businessRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public SaleResponseDTO processSale(CreateSaleRequestDTO request) {
        String businessId = currentUserService.getCurrentUserBusinessId();
        String userEmail = currentUserService.getCurrentUserEmail();

        log.info("Processing sale request for tenant '{}' (cashier: '{}'): item='{}', qty={}",
                businessId, userEmail, request.getItemName() != null ? request.getItemName() : request.getItemCode(),
                request.getQuantitySold());

        // 1. Locate Item with Multi-Tenant Isolation
        Item item = resolveItem(businessId, request);
        int currentStock = item.getQuantity() != null ? item.getQuantity() : 0;
        int qtySold = request.getQuantitySold();

        // 2. Validate Stock Availability (Prevent Overselling & Zero Stock)
        if (currentStock < qtySold) {
            log.warn("Insufficient stock for item '{}' (tenant '{}'): available={}, requested={}",
                    item.getName(), businessId, currentStock, qtySold);
            throw new InsufficientStockException(
                    "Insufficient stock available for '" + item.getName() + "'. Current stock: " + currentStock + " boxes, Requested: " + qtySold + " boxes."
            );
        }

        // 3. Atomically Deduct Stock & Update Item Status
        int newStock = currentStock - qtySold;
        item.setQuantity(newStock);

        if (newStock == 0) {
            item.setStatus("Out of Stock");
        } else if (newStock <= LOW_STOCK_THRESHOLD) {
            item.setStatus("Low Stock");
        } else {
            item.setStatus("In Stock");
        }

        Item updatedItem = itemRepository.save(item);
        log.info("Stock updated for '{}': {} -> {} (Status: '{}')",
                item.getName(), currentStock, newStock, updatedItem.getStatus());

        // 4. Calculate Financials (Base USD)
        double unitPrice = request.getUnitPrice() != null && request.getUnitPrice() > 0
                ? request.getUnitPrice()
                : (item.getSellingPrice() != null && item.getSellingPrice() > 0
                ? item.getSellingPrice()
                : (item.getPrice() != null ? item.getPrice() : 0.0));
        double totalAmount = Math.round(unitPrice * qtySold * 100.0) / 100.0;

        String txCurrency = (request.getCurrency() != null && !request.getCurrency().isBlank())
                ? request.getCurrency().trim().toUpperCase()
                : "USD";
        double txExchangeRate = (request.getExchangeRate() != null && request.getExchangeRate() > 0)
                ? request.getExchangeRate()
                : 1.0;
        double txAmount = (request.getTransactionAmount() != null && request.getTransactionAmount() > 0)
                ? request.getTransactionAmount()
                : Math.round(totalAmount * txExchangeRate * 100.0) / 100.0;

        // 5. Generate Unique Invoice Number
        String dateStr = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now());
        String randomSuffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String invoiceNumber = "INV-" + dateStr + "-" + randomSuffix;

        // 6. Record Audit Trail & Persist Sale Transaction
        SaleTransaction transaction = SaleTransaction.builder()
                .businessId(businessId)
                .invoiceNumber(invoiceNumber)
                .itemId(item.getId())
                .itemCode(item.getCode())
                .itemName(item.getName())
                .quantitySold(qtySold)
                .unitPrice(unitPrice)
                .totalAmount(totalAmount)
                .currency(txCurrency)
                .exchangeRate(txExchangeRate)
                .transactionAmount(txAmount)
                .stockBefore(currentStock)
                .stockAfter(newStock)
                .customerName(request.getCustomerName() != null ? request.getCustomerName().trim() : "Walk-in Customer")
                .customerPhone(request.getCustomerPhone())
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "CASH")
                .notes(request.getNotes())
                .createdBy(userEmail)
                .createdAt(LocalDateTime.now())
                .build();

        SaleTransaction savedTx = saleTransactionRepository.save(transaction);
        log.info("Sale transaction recorded: Invoice='{}', Total=${} ({} {})", invoiceNumber, totalAmount, txCurrency, txAmount);

        // 7. Check Low Stock Trigger Condition
        boolean isLowStock = newStock <= LOW_STOCK_THRESHOLD;
        String alertMessage = null;
        if (isLowStock) {
            alertMessage = "⚠️ LOW STOCK ALERT: " + item.getName() + " — " + newStock + " boxes remaining (<= " + LOW_STOCK_THRESHOLD + " threshold)";
            log.warn("Triggered Low Stock Alert for tenant '{}': {}", businessId, alertMessage);
        }

        String encodedName = URLEncoder.encode(item.getName(), StandardCharsets.UTF_8);

        return SaleResponseDTO.builder()
                .transactionId(savedTx.getId())
                .invoiceNumber(invoiceNumber)
                .itemId(item.getId())
                .itemCode(item.getCode())
                .itemName(item.getName())
                .quantitySold(qtySold)
                .unitPrice(unitPrice)
                .totalAmount(totalAmount)
                .currency(savedTx.getCurrency() != null ? savedTx.getCurrency() : "USD")
                .exchangeRate(savedTx.getExchangeRate() != null ? savedTx.getExchangeRate() : 1.0)
                .transactionAmount(savedTx.getTransactionAmount() != null ? savedTx.getTransactionAmount() : totalAmount)
                .stockBefore(currentStock)
                .stockAfter(newStock)
                .itemStatus(updatedItem.getStatus())
                .isLowStock(isLowStock)
                .lowStockThreshold(LOW_STOCK_THRESHOLD)
                .alertMessage(alertMessage)
                .suggestedReorderRoute("/reorder?medicine=" + encodedName)
                .suggestedForecastRoute("/prediction")
                .customerName(savedTx.getCustomerName())
                .customerPhone(savedTx.getCustomerPhone())
                .paymentMethod(savedTx.getPaymentMethod())
                .createdBy(userEmail)
                .createdAt(savedTx.getCreatedAt())
                .build();
    }

    @Override
    public List<SaleResponseDTO> getRecentSales(int limit) {
        String businessId = currentUserService.getCurrentUserBusinessId();
        List<SaleTransaction> transactions = saleTransactionRepository.findTop20ByBusinessIdOrderByCreatedAtDesc(businessId);

        return transactions.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public InvoiceDTO getInvoice(String invoiceNumber) {
        String businessId = currentUserService.getCurrentUserBusinessId();
        SaleTransaction tx = saleTransactionRepository.findByBusinessIdAndInvoiceNumber(businessId, invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with number: " + invoiceNumber));

        String businessName = businessRepository.findById(businessId)
                .map(Business::getBusinessName)
                .orElse("StockUp Pharmacy");

        return InvoiceDTO.builder()
                .invoiceNumber(tx.getInvoiceNumber())
                .transactionId(tx.getId())
                .businessId(businessId)
                .businessName(businessName)
                .customerName(tx.getCustomerName())
                .customerPhone(tx.getCustomerPhone())
                .paymentMethod(tx.getPaymentMethod())
                .itemId(tx.getItemId())
                .itemCode(tx.getItemCode())
                .itemName(tx.getItemName())
                .quantity(tx.getQuantitySold())
                .unitPrice(tx.getUnitPrice())
                .totalAmount(tx.getTotalAmount())
                .currency(tx.getCurrency() != null ? tx.getCurrency() : "USD")
                .exchangeRate(tx.getExchangeRate() != null ? tx.getExchangeRate() : 1.0)
                .transactionAmount(tx.getTransactionAmount() != null ? tx.getTransactionAmount() : tx.getTotalAmount())
                .remainingStock(tx.getStockAfter())
                .createdBy(tx.getCreatedBy())
                .createdAt(tx.getCreatedAt())
                .notes(tx.getNotes())
                .build();
    }

    private Item resolveItem(String businessId, CreateSaleRequestDTO request) {
        if (request.getItemId() != null && !request.getItemId().isBlank()) {
            return itemRepository.findById(request.getItemId())
                    .filter(i -> businessId.equals(i.getBusinessId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + request.getItemId()));
        }

        if (request.getItemCode() != null && !request.getItemCode().isBlank()) {
            return itemRepository.findByCodeIgnoreCase(request.getItemCode())
                    .filter(i -> businessId.equals(i.getBusinessId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found with code: " + request.getItemCode()));
        }

        if (request.getItemName() != null && !request.getItemName().isBlank()) {
            List<Item> items = itemRepository.findByBusinessId(businessId);
            return items.stream()
                    .filter(i -> i.getName() != null && i.getName().equalsIgnoreCase(request.getItemName().trim()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found with name: " + request.getItemName()));
        }

        throw new IllegalArgumentException("Either itemId, itemCode, or itemName must be provided.");
    }

    private SaleResponseDTO mapToDTO(SaleTransaction tx) {
        boolean isLow = tx.getStockAfter() <= LOW_STOCK_THRESHOLD;
        String encodedName = URLEncoder.encode(tx.getItemName(), StandardCharsets.UTF_8);

        return SaleResponseDTO.builder()
                .transactionId(tx.getId())
                .invoiceNumber(tx.getInvoiceNumber())
                .itemId(tx.getItemId())
                .itemCode(tx.getItemCode())
                .itemName(tx.getItemName())
                .quantitySold(tx.getQuantitySold())
                .unitPrice(tx.getUnitPrice())
                .totalAmount(tx.getTotalAmount())
                .currency(tx.getCurrency() != null ? tx.getCurrency() : "USD")
                .exchangeRate(tx.getExchangeRate() != null ? tx.getExchangeRate() : 1.0)
                .transactionAmount(tx.getTransactionAmount() != null ? tx.getTransactionAmount() : tx.getTotalAmount())
                .stockBefore(tx.getStockBefore())
                .stockAfter(tx.getStockAfter())
                .itemStatus(tx.getStockAfter() == 0 ? "Out of Stock" : (isLow ? "Low Stock" : "In Stock"))
                .isLowStock(isLow)
                .lowStockThreshold(LOW_STOCK_THRESHOLD)
                .alertMessage(isLow ? "⚠️ LOW STOCK: " + tx.getItemName() + " — " + tx.getStockAfter() + " boxes remaining" : null)
                .suggestedReorderRoute("/reorder?medicine=" + encodedName)
                .suggestedForecastRoute("/prediction")
                .customerName(tx.getCustomerName())
                .customerPhone(tx.getCustomerPhone())
                .paymentMethod(tx.getPaymentMethod())
                .createdBy(tx.getCreatedBy())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
