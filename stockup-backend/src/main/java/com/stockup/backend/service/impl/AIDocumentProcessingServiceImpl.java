package com.stockup.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockup.backend.dto.document.*;
import com.stockup.backend.model.*;
import com.stockup.backend.repository.*;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.service.AIDocumentProcessingService;
import com.stockup.backend.service.DocumentParserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIDocumentProcessingServiceImpl implements AIDocumentProcessingService {

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "csv");
    private static final String UPLOAD_DIR_BASE = "uploads/documents";

    private final DocumentProcessingRepository documentRepository;
    private final DocumentAuditLogRepository auditLogRepository;
    private final ItemRepository itemRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SaleTransactionRepository saleTransactionRepository;
    private final DocumentParserService documentParserService;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    @Override
    public DocumentUploadResponseDTO uploadDocument(MultipartFile file) {
        String businessId = currentUserService.getCurrentUserBusinessId();
        String userEmail = currentUserService.getCurrentUserEmail();

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be null or empty.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 10MB.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "uploaded_document";
        }

        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported file type ." + extension + ". Only PDF and CSV pharmacy documents are supported.");
        }

        String fileType = extension.toUpperCase();
        String sanitizedFilename = sanitizeFilename(originalFilename);
        String fileUuid = UUID.randomUUID().toString();

        // Secure file storage scoped by business
        Path tenantUploadDir = Paths.get(UPLOAD_DIR_BASE, businessId);
        try {
            Files.createDirectories(tenantUploadDir);
            String storedFileName = fileUuid + "_" + sanitizedFilename;
            Path destinationPath = tenantUploadDir.resolve(storedFileName);
            Files.copy(file.getInputStream(), destinationPath, StandardCopyOption.REPLACE_EXISTING);

            DocumentProcessing doc = DocumentProcessing.builder()
                    .businessId(businessId)
                    .uploadedBy(userEmail)
                    .fileName(sanitizedFilename)
                    .fileType(fileType)
                    .fileSize(file.getSize())
                    .status("UPLOADED")
                    .storageReference(destinationPath.toString())
                    .createdAt(LocalDateTime.now())
                    .build();

            DocumentProcessing savedDoc = documentRepository.save(doc);
            log.info("Document successfully uploaded: id={}, file={}, tenant={}", savedDoc.getId(), sanitizedFilename, businessId);

            return DocumentUploadResponseDTO.builder()
                    .documentId(savedDoc.getId())
                    .fileName(sanitizedFilename)
                    .fileType(fileType)
                    .fileSize(file.getSize())
                    .status("UPLOADED")
                    .uploadedAt(savedDoc.getCreatedAt())
                    .message("File uploaded successfully. Ready for AI document analysis.")
                    .build();

        } catch (IOException e) {
            log.error("Failed to store uploaded document file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to store uploaded file on server: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public DocumentAnalysisResponseDTO analyzeDocument(String documentId, String overrideDocumentType) {
        String businessId = currentUserService.getCurrentUserBusinessId();
        DocumentProcessing doc = documentRepository.findByIdAndBusinessId(documentId, businessId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found or does not belong to your company: " + documentId));

        File file = new File(doc.getStorageReference());
        if (!file.exists()) {
            throw new IllegalStateException("Uploaded file storage reference not found on disk: " + doc.getStorageReference());
        }

        doc.setStatus("ANALYZING");
        documentRepository.save(doc);

        DocumentParserService.ParsedDocumentResult parsed;
        try (InputStream is = new FileInputStream(file)) {
            if ("PDF".equalsIgnoreCase(doc.getFileType())) {
                parsed = documentParserService.parsePdf(is, doc.getFileName());
            } else {
                parsed = documentParserService.parseCsv(is, doc.getFileName());
            }
        } catch (Exception e) {
            doc.setStatus("FAILED");
            doc.setErrorMessage("Error reading or parsing document: " + e.getMessage());
            documentRepository.save(doc);
            throw new RuntimeException("Failed to parse document: " + e.getMessage());
        }

        // Classify Document Type & Confidence
        ClassificationResult classification = classifyDocument(doc.getFileName(), parsed, overrideDocumentType);
        String docType = classification.documentType;
        double confidence = classification.confidence;

        // Fetch tenant medicines for matching
        List<Item> tenantItems = itemRepository.findByBusinessId(businessId);
        Map<String, Item> itemsByCode = new HashMap<>();
        Map<String, Item> itemsByName = new HashMap<>();
        for (Item item : tenantItems) {
            if (item.getCode() != null) itemsByCode.put(item.getCode().trim().toLowerCase(), item);
            if (item.getName() != null) itemsByName.put(normalizeMedicineName(item.getName()), item);
        }

        List<DocumentItemPreviewDTO> previewItems = new ArrayList<>();
        List<String> warnings = new ArrayList<>(parsed.parseWarnings());

        int matchedCount = 0;
        int createdCount = 0;
        int updatedCount = 0;
        int duplicateCount = 0;
        int insufficientStockCount = 0;
        double computedGrandTotal = 0.0;

        for (DocumentItemPreviewDTO rawItem : parsed.items()) {
            String medName = rawItem.getMedicineName();
            String medCode = rawItem.getMedicineCode();
            int qty = rawItem.getQuantityChange() != null ? rawItem.getQuantityChange() : 1;
            double unitPrice = rawItem.getUnitPrice() != null ? rawItem.getUnitPrice() : 0.0;
            double totalPrice = rawItem.getTotalPrice() != null && rawItem.getTotalPrice() > 0 ? rawItem.getTotalPrice() : (unitPrice * qty);

            computedGrandTotal += totalPrice;

            // Find matching item in tenant inventory
            Item matchedItem = null;
            if (medCode != null && !medCode.isBlank()) {
                matchedItem = itemsByCode.get(medCode.trim().toLowerCase());
            }
            if (matchedItem == null && medName != null && !medName.isBlank()) {
                matchedItem = itemsByName.get(normalizeMedicineName(medName));
                if (matchedItem == null) {
                    matchedItem = findFuzzyMatch(medName, tenantItems);
                }
            }

            int currentStock = matchedItem != null ? (matchedItem.getQuantity() != null ? matchedItem.getQuantity() : 0) : 0;
            int newStock = currentStock;
            String action = "REVIEW";
            String itemStatus = "MATCHED";
            String itemWarning = null;

            if (isPurchaseType(docType)) {
                action = "ADD_PURCHASE";
                newStock = currentStock + qty;
                if (matchedItem != null) {
                    matchedCount++;
                    updatedCount++;
                } else {
                    createdCount++;
                    itemStatus = "NEW_MEDICINE";
                    itemWarning = "New medicine will be auto-created in inventory database.";
                }
            } else if (isSaleType(docType)) {
                action = "DEDUCT_SALE";
                newStock = Math.max(0, currentStock - qty);
                if (matchedItem != null) {
                    matchedCount++;
                    if (currentStock < qty) {
                        itemStatus = "INSUFFICIENT_STOCK";
                        itemWarning = "Insufficient inventory stock! Available: " + currentStock + ", Requested: " + qty;
                        insufficientStockCount++;
                    } else {
                        updatedCount++;
                    }
                } else {
                    itemStatus = "WARNING";
                    itemWarning = "Medicine not found in inventory. Cannot record sale.";
                    insufficientStockCount++;
                }
            } else {
                // MEDICINE_MASTER / INVENTORY_LIST
                if (matchedItem != null) {
                    action = "UPDATE";
                    newStock = qty;
                    matchedCount++;
                    updatedCount++;
                } else {
                    action = "CREATE";
                    newStock = qty;
                    createdCount++;
                    itemStatus = "NEW_MEDICINE";
                }
            }

            DocumentItemPreviewDTO previewDto = DocumentItemPreviewDTO.builder()
                    .rowIndex(rawItem.getRowIndex())
                    .medicineName(medName)
                    .medicineCode(medCode != null ? medCode : (matchedItem != null ? matchedItem.getCode() : null))
                    .category(rawItem.getCategory() != null ? rawItem.getCategory() : (matchedItem != null ? matchedItem.getCategory() : "General Medicine"))
                    .dosageForm(rawItem.getDosageForm() != null ? rawItem.getDosageForm() : "Tablet")
                    .currentStock(currentStock)
                    .quantityChange(qty)
                    .newStock(newStock)
                    .unitPrice(unitPrice > 0 ? unitPrice : (matchedItem != null && matchedItem.getPrice() != null ? matchedItem.getPrice() : 0.0))
                    .totalPrice(totalPrice)
                    .action(action)
                    .status(itemStatus)
                    .warning(itemWarning)
                    .matchedItemId(matchedItem != null ? matchedItem.getId() : null)
                    .matchedItemName(matchedItem != null ? matchedItem.getName() : null)
                    .expiryDate(rawItem.getExpiryDate() != null ? rawItem.getExpiryDate() : (matchedItem != null ? matchedItem.getExpiryDate() : null))
                    .batchNumber(rawItem.getBatchNumber())
                    .build();

            previewItems.add(previewDto);
        }

        // Check for duplicate invoice
        String invoiceNum = parsed.detectedInvoiceNumber();
        boolean isDuplicate = false;
        String duplicateMsg = null;

        if (invoiceNum != null && !invoiceNum.isBlank()) {
            if (isPurchaseType(docType)) {
                boolean poExists = purchaseOrderRepository.findByPoNumberAndBusinessId(invoiceNum, businessId).isPresent();
                boolean docExists = documentRepository.existsByBusinessIdAndInvoiceNumberAndStatus(businessId, invoiceNum, "APPLIED");
                if (poExists || docExists) {
                    isDuplicate = true;
                    duplicateMsg = "Purchase invoice '" + invoiceNum + "' appears to have already been recorded in StockUp AI.";
                    warnings.add("Duplicate Warning: " + duplicateMsg);
                }
            } else if (isSaleType(docType)) {
                boolean saleExists = saleTransactionRepository.findByBusinessIdAndInvoiceNumber(businessId, invoiceNum).isPresent();
                boolean docExists = documentRepository.existsByBusinessIdAndInvoiceNumberAndStatus(businessId, invoiceNum, "APPLIED");
                if (saleExists || docExists) {
                    isDuplicate = true;
                    duplicateMsg = "Sales invoice '" + invoiceNum + "' appears to have already been processed in StockUp AI.";
                    warnings.add("Duplicate Warning: " + duplicateMsg);
                }
            }
        }

        Double grandTotal = parsed.detectedGrandTotal() != null ? parsed.detectedGrandTotal() : computedGrandTotal;
        String status = isDuplicate || insufficientStockCount > 0 || !warnings.isEmpty() ? "REQUIRES_REVIEW" : "READY_TO_APPLY";

        // Save analysis to DocumentProcessing entity
        doc.setDocumentType(docType);
        doc.setConfidence(confidence);
        doc.setStatus(status);
        doc.setSupplierName(parsed.detectedSupplier());
        doc.setCustomerName(parsed.detectedCustomer());
        doc.setInvoiceNumber(invoiceNum);
        doc.setInvoiceDate(parsed.detectedDate());
        doc.setGrandTotal(grandTotal);
        doc.setCurrency(parsed.detectedCurrency());
        doc.setItemsDetected(previewItems.size());
        doc.setCreatedCount(createdCount);
        doc.setUpdatedCount(updatedCount);
        doc.setDuplicateCount(duplicateCount);
        doc.setProcessedAt(LocalDateTime.now());

        try {
            doc.setExtractedDataJson(objectMapper.writeValueAsString(previewItems));
            doc.setValidationResultJson(objectMapper.writeValueAsString(warnings));
        } catch (Exception e) {
            log.warn("Could not serialize preview JSON: {}", e.getMessage());
        }

        documentRepository.save(doc);

        String textPreview = parsed.rawText().length() > 500
                ? parsed.rawText().substring(0, 500) + "..."
                : parsed.rawText();

        return DocumentAnalysisResponseDTO.builder()
                .documentId(doc.getId())
                .fileName(doc.getFileName())
                .fileType(doc.getFileType())
                .documentType(docType)
                .confidence(confidence)
                .status(status)
                .supplierName(doc.getSupplierName())
                .customerName(doc.getCustomerName())
                .invoiceNumber(doc.getInvoiceNumber())
                .invoiceDate(doc.getInvoiceDate())
                .grandTotal(grandTotal)
                .currency(doc.getCurrency())
                .itemsDetected(previewItems.size())
                .matchedCount(matchedCount)
                .createdCount(createdCount)
                .updatedCount(updatedCount)
                .duplicateCount(duplicateCount)
                .insufficientStockCount(insufficientStockCount)
                .warnings(warnings)
                .previewItems(previewItems)
                .extractedTextPreview(textPreview)
                .isDuplicateInvoice(isDuplicate)
                .duplicateInvoiceMessage(duplicateMsg)
                .processedAt(doc.getProcessedAt())
                .build();
    }

    @Override
    @Transactional
    public DocumentApplyResultDTO applyDocument(String documentId, DocumentApplyRequestDTO request) {
        String businessId = currentUserService.getCurrentUserBusinessId();
        String userEmail = currentUserService.getCurrentUserEmail();

        DocumentProcessing doc = documentRepository.findByIdAndBusinessId(documentId, businessId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found for this tenant: " + documentId));

        if ("APPLIED".equalsIgnoreCase(doc.getStatus())) {
            throw new IllegalStateException("This document has already been applied. Cannot process twice.");
        }

        if (doc.getExtractedDataJson() == null || doc.getExtractedDataJson().isBlank()) {
            throw new IllegalStateException("Document has not been analyzed yet. Please run document analysis first.");
        }

        List<DocumentItemPreviewDTO> items;
        try {
            items = objectMapper.readValue(doc.getExtractedDataJson(), new TypeReference<List<DocumentItemPreviewDTO>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Failed to read document preview data: " + e.getMessage());
        }

        if (items == null || items.isEmpty()) {
            throw new IllegalStateException("No items detected to apply.");
        }

        String docType = request != null && request.getDocumentType() != null && !request.getDocumentType().isBlank()
                ? request.getDocumentType().trim().toUpperCase()
                : doc.getDocumentType();

        int processed = 0;
        int created = 0;
        int updated = 0;
        int failed = 0;
        List<String> errorDetails = new ArrayList<>();

        if (isPurchaseType(docType)) {
            // ── Purchase Invoice / CSV Ingestion ──────────────────────────────
            Supplier supplier = null;
            if (doc.getSupplierName() != null && !doc.getSupplierName().isBlank()) {
                supplier = supplierRepository.findByNameIgnoreCaseAndBusinessId(doc.getSupplierName().trim(), businessId)
                        .orElseGet(() -> {
                            Supplier newSupp = new Supplier();
                            newSupp.setName(doc.getSupplierName().trim());
                            newSupp.setBusinessId(businessId);
                            newSupp.setStatus("ACTIVE");
                            newSupp.setPerformanceScore(90.0);
                            newSupp.setAvgLeadTimeDays(3.0);
                            newSupp.setFulfilledOrders(1);
                            return supplierRepository.save(newSupp);
                        });
            }

            for (DocumentItemPreviewDTO itemDto : items) {
                try {
                    Item item = null;
                    if (itemDto.getMatchedItemId() != null) {
                        item = itemRepository.findByIdAndBusinessId(itemDto.getMatchedItemId(), businessId).orElse(null);
                    }
                    if (item == null && itemDto.getMedicineCode() != null) {
                        item = itemRepository.findByCodeIgnoreCaseAndBusinessId(itemDto.getMedicineCode(), businessId).orElse(null);
                    }
                    if (item == null && itemDto.getMedicineName() != null) {
                        item = itemRepository.findByNameIgnoreCaseAndBusinessId(itemDto.getMedicineName(), businessId).orElse(null);
                    }

                    int addQty = itemDto.getQuantityChange() != null ? Math.max(1, itemDto.getQuantityChange()) : 1;
                    double unitPrice = itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : 0.0;

                    if (item != null) {
                        // Increment stock atomically
                        int newStock = (item.getQuantity() != null ? item.getQuantity() : 0) + addQty;
                        item.setQuantity(newStock);
                        if (unitPrice > 0) item.setPrice(unitPrice);
                        updateItemStatus(item);
                        itemRepository.save(item);
                        updated++;
                    } else {
                        // Create new item in tenant catalog
                        Item newItem = new Item();
                        newItem.setBusinessId(businessId);
                        newItem.setName(itemDto.getMedicineName());
                        newItem.setCode(itemDto.getMedicineCode() != null ? itemDto.getMedicineCode() : generateMedicineCode(itemDto.getMedicineName()));
                        newItem.setCategory(itemDto.getCategory() != null ? itemDto.getCategory() : "General Medicine");
                        newItem.setManufacturer(doc.getSupplierName() != null ? doc.getSupplierName() : "General Pharma");
                        newItem.setQuantity(addQty);
                        newItem.setPrice(unitPrice > 0 ? unitPrice : 10.0);
                        newItem.setExpiryDate(itemDto.getExpiryDate() != null ? itemDto.getExpiryDate() : "2027-12-31");
                        newItem.setStatus("In Stock");
                        item = itemRepository.save(newItem);
                        created++;
                    }

                    // Record PurchaseOrder
                    String poNumber = doc.getInvoiceNumber() != null ? doc.getInvoiceNumber() : ("PO-" + System.currentTimeMillis() % 1000000);
                    PurchaseOrder po = new PurchaseOrder();
                    po.setPoNumber(poNumber + "-" + (itemDto.getRowIndex() != null ? itemDto.getRowIndex() : processed));
                    po.setBusinessId(businessId);
                    po.setItemId(item.getId());
                    po.setItemCode(item.getCode());
                    po.setItemName(item.getName());
                    po.setSupplierId(supplier != null ? supplier.getId() : null);
                    po.setSupplierName(supplier != null ? supplier.getName() : (doc.getSupplierName() != null ? doc.getSupplierName() : "Standard Distributor"));
                    po.setQuantityOrdered(addQty);
                    po.setUnitPrice(unitPrice > 0 ? unitPrice : (item.getPrice() != null ? item.getPrice() : 10.0));
                    po.setTotalAmount(unitPrice * addQty);
                    po.setStatus(PurchaseOrderStatus.RECEIVED);
                    po.setPriority("Normal");
                    po.setNotes("Ingested via AI Document Processing from " + doc.getFileName());
                    po.setReceivedAt(LocalDateTime.now());
                    purchaseOrderRepository.save(po);

                    processed++;
                } catch (Exception e) {
                    log.error("Failed to process purchase item row {}: {}", itemDto.getRowIndex(), e.getMessage());
                    failed++;
                    errorDetails.add("Row " + itemDto.getRowIndex() + " (" + itemDto.getMedicineName() + "): " + e.getMessage());
                }
            }

        } else if (isSaleType(docType)) {
            // ── Sales Invoice / CSV Ingestion ────────────────────────────────
            // First check all items stock availability
            for (DocumentItemPreviewDTO itemDto : items) {
                Item item = null;
                if (itemDto.getMatchedItemId() != null) {
                    item = itemRepository.findByIdAndBusinessId(itemDto.getMatchedItemId(), businessId).orElse(null);
                }
                if (item == null && itemDto.getMedicineName() != null) {
                    item = itemRepository.findByNameIgnoreCaseAndBusinessId(itemDto.getMedicineName(), businessId).orElse(null);
                }

                int deductQty = itemDto.getQuantityChange() != null ? Math.max(1, itemDto.getQuantityChange()) : 1;
                if (item == null) {
                    throw new IllegalArgumentException("Cannot record sale for non-existent medicine '" + itemDto.getMedicineName() + "'");
                }
                if (item.getQuantity() == null || item.getQuantity() < deductQty) {
                    throw new IllegalArgumentException("Insufficient inventory stock for '" + item.getName() + "'. Available: " + item.getQuantity() + ", Required: " + deductQty);
                }
            }

            // Apply sales and deduct stock
            for (DocumentItemPreviewDTO itemDto : items) {
                try {
                    Item item = itemDto.getMatchedItemId() != null
                            ? itemRepository.findByIdAndBusinessId(itemDto.getMatchedItemId(), businessId).orElse(null)
                            : itemRepository.findByNameIgnoreCaseAndBusinessId(itemDto.getMedicineName(), businessId).orElse(null);

                    int deductQty = itemDto.getQuantityChange() != null ? Math.max(1, itemDto.getQuantityChange()) : 1;
                    double unitPrice = itemDto.getUnitPrice() != null && itemDto.getUnitPrice() > 0 ? itemDto.getUnitPrice() : (item.getPrice() != null ? item.getPrice() : 10.0);
                    double total = unitPrice * deductQty;

                    int stockBefore = item.getQuantity() != null ? item.getQuantity() : 0;
                    int newQty = Math.max(0, stockBefore - deductQty);
                    item.setQuantity(newQty);
                    updateItemStatus(item);
                    itemRepository.save(item);

                    // Record SaleTransaction
                    String invoiceNumber = doc.getInvoiceNumber() != null ? doc.getInvoiceNumber() : ("INV-" + DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
                    SaleTransaction tx = SaleTransaction.builder()
                            .businessId(businessId)
                            .invoiceNumber(invoiceNumber + "-" + (itemDto.getRowIndex() != null ? itemDto.getRowIndex() : processed))
                            .itemId(item.getId())
                            .itemName(item.getName())
                            .quantitySold(deductQty)
                            .unitPrice(unitPrice)
                            .totalAmount(total)
                            .stockBefore(stockBefore)
                            .stockAfter(newQty)
                            .createdBy(userEmail)
                            .customerName(doc.getCustomerName() != null ? doc.getCustomerName() : "Walk-in Customer")
                            .customerPhone("—")
                            .paymentMethod("INVOICE_IMPORT")
                            .currency(doc.getCurrency() != null ? doc.getCurrency() : "USD")
                            .exchangeRate(1.0)
                            .transactionAmount(total)
                            .createdAt(LocalDateTime.now())
                            .build();

                    saleTransactionRepository.save(tx);
                    updated++;
                    processed++;
                } catch (Exception e) {
                    failed++;
                    errorDetails.add("Row " + itemDto.getRowIndex() + " (" + itemDto.getMedicineName() + "): " + e.getMessage());
                }
            }

        } else {
            // ── Medicine Master / Inventory List ─────────────────────────────
            for (DocumentItemPreviewDTO itemDto : items) {
                try {
                    Item item = null;
                    if (itemDto.getMatchedItemId() != null) {
                        item = itemRepository.findByIdAndBusinessId(itemDto.getMatchedItemId(), businessId).orElse(null);
                    }
                    if (item == null && itemDto.getMedicineCode() != null) {
                        item = itemRepository.findByCodeIgnoreCaseAndBusinessId(itemDto.getMedicineCode(), businessId).orElse(null);
                    }
                    if (item == null && itemDto.getMedicineName() != null) {
                        item = itemRepository.findByNameIgnoreCaseAndBusinessId(itemDto.getMedicineName(), businessId).orElse(null);
                    }

                    int stockQty = itemDto.getQuantityChange() != null ? itemDto.getQuantityChange() : 100;
                    double unitPrice = itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : 15.0;

                    if (item != null) {
                        item.setQuantity(stockQty);
                        if (unitPrice > 0) item.setPrice(unitPrice);
                        if (itemDto.getCategory() != null) item.setCategory(itemDto.getCategory());
                        updateItemStatus(item);
                        itemRepository.save(item);
                        updated++;
                    } else {
                        Item newItem = new Item();
                        newItem.setBusinessId(businessId);
                        newItem.setName(itemDto.getMedicineName());
                        newItem.setCode(itemDto.getMedicineCode() != null ? itemDto.getMedicineCode() : generateMedicineCode(itemDto.getMedicineName()));
                        newItem.setCategory(itemDto.getCategory() != null ? itemDto.getCategory() : "General Medicine");
                        newItem.setManufacturer("General Pharma");
                        newItem.setQuantity(stockQty);
                        newItem.setPrice(unitPrice > 0 ? unitPrice : 15.0);
                        newItem.setExpiryDate(itemDto.getExpiryDate() != null ? itemDto.getExpiryDate() : "2027-12-31");
                        newItem.setStatus(stockQty > 50 ? "In Stock" : "Low Stock");
                        itemRepository.save(newItem);
                        created++;
                    }
                    processed++;
                } catch (Exception e) {
                    failed++;
                    errorDetails.add("Row " + itemDto.getRowIndex() + " (" + itemDto.getMedicineName() + "): " + e.getMessage());
                }
            }
        }

        String summary = String.format("Successfully applied %s: %d processed (%d created, %d updated, %d failed).",
                docType, processed, created, updated, failed);

        // Record Audit Log
        DocumentAuditLog auditLog = DocumentAuditLog.builder()
                .businessId(businessId)
                .documentId(doc.getId())
                .userEmail(userEmail)
                .fileName(doc.getFileName())
                .action(docType + "_IMPORT")
                .recordsCount(processed)
                .createdCount(created)
                .updatedCount(updated)
                .failedCount(failed)
                .status(failed == 0 ? "SUCCESS" : "PARTIAL")
                .summary(summary)
                .timestamp(LocalDateTime.now())
                .build();

        auditLogRepository.save(auditLog);

        // Update DocumentProcessing entity
        doc.setStatus("APPLIED");
        doc.setAppliedAt(LocalDateTime.now());
        try {
            doc.setAppliedSummaryJson(objectMapper.writeValueAsString(Map.of(
                    "processed", processed,
                    "created", created,
                    "updated", updated,
                    "failed", failed,
                    "summary", summary
            )));
        } catch (Exception ignored) {}

        documentRepository.save(doc);

        return DocumentApplyResultDTO.builder()
                .documentId(doc.getId())
                .fileName(doc.getFileName())
                .documentType(docType)
                .status(doc.getStatus())
                .recordsProcessed(processed)
                .recordsCreated(created)
                .recordsUpdated(updated)
                .recordsFailed(failed)
                .grandTotal(doc.getGrandTotal())
                .currency(doc.getCurrency())
                .summaryMessage(summary)
                .auditLogId(auditLog.getId())
                .errorDetails(errorDetails)
                .appliedAt(doc.getAppliedAt())
                .build();
    }

    @Override
    public List<DocumentSummaryDTO> getDocumentHistory() {
        String businessId = currentUserService.getCurrentUserBusinessId();
        List<DocumentProcessing> docs = documentRepository.findAllByBusinessIdOrderByCreatedAtDesc(businessId);
        List<DocumentSummaryDTO> result = new ArrayList<>();

        for (DocumentProcessing doc : docs) {
            result.add(DocumentSummaryDTO.builder()
                    .id(doc.getId())
                    .fileName(doc.getFileName())
                    .fileType(doc.getFileType())
                    .documentType(doc.getDocumentType())
                    .status(doc.getStatus())
                    .itemsDetected(doc.getItemsDetected())
                    .grandTotal(doc.getGrandTotal())
                    .currency(doc.getCurrency())
                    .uploadedBy(doc.getUploadedBy())
                    .createdAt(doc.getCreatedAt())
                    .appliedAt(doc.getAppliedAt())
                    .build());
        }
        return result;
    }

    @Override
    public DocumentAnalysisResponseDTO getDocumentDetails(String documentId) {
        String businessId = currentUserService.getCurrentUserBusinessId();
        DocumentProcessing doc = documentRepository.findByIdAndBusinessId(documentId, businessId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));

        List<DocumentItemPreviewDTO> items = new ArrayList<>();
        if (doc.getExtractedDataJson() != null) {
            try {
                items = objectMapper.readValue(doc.getExtractedDataJson(), new TypeReference<List<DocumentItemPreviewDTO>>() {});
            } catch (Exception ignored) {}
        }

        List<String> warnings = new ArrayList<>();
        if (doc.getValidationResultJson() != null) {
            try {
                warnings = objectMapper.readValue(doc.getValidationResultJson(), new TypeReference<List<String>>() {});
            } catch (Exception ignored) {}
        }

        return DocumentAnalysisResponseDTO.builder()
                .documentId(doc.getId())
                .fileName(doc.getFileName())
                .fileType(doc.getFileType())
                .documentType(doc.getDocumentType())
                .confidence(doc.getConfidence())
                .status(doc.getStatus())
                .supplierName(doc.getSupplierName())
                .customerName(doc.getCustomerName())
                .invoiceNumber(doc.getInvoiceNumber())
                .invoiceDate(doc.getInvoiceDate())
                .grandTotal(doc.getGrandTotal())
                .currency(doc.getCurrency())
                .itemsDetected(doc.getItemsDetected())
                .createdCount(doc.getCreatedCount())
                .updatedCount(doc.getUpdatedCount())
                .duplicateCount(doc.getDuplicateCount())
                .warnings(warnings)
                .previewItems(items)
                .processedAt(doc.getProcessedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteDocument(String documentId) {
        String businessId = currentUserService.getCurrentUserBusinessId();
        DocumentProcessing doc = documentRepository.findByIdAndBusinessId(documentId, businessId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));

        if (doc.getStorageReference() != null) {
            try {
                Files.deleteIfExists(Paths.get(doc.getStorageReference()));
            } catch (Exception e) {
                log.warn("Could not delete physical file: {}", e.getMessage());
            }
        }
        documentRepository.delete(doc);
    }

    // ── Helper Classification and Matching Methods ───────────────────────────

    private record ClassificationResult(String documentType, double confidence) {}

    private ClassificationResult classifyDocument(String fileName, DocumentParserService.ParsedDocumentResult parsed, String override) {
        if (override != null && !override.isBlank()) {
            return new ClassificationResult(override.trim().toUpperCase(), 1.0);
        }

        String fullText = (fileName + " " + (parsed.rawText() != null ? parsed.rawText() : "")).toLowerCase();

        boolean hasSupplier = parsed.detectedSupplier() != null;
        boolean hasCustomer = parsed.detectedCustomer() != null;
        boolean hasInvoice = parsed.detectedInvoiceNumber() != null;

        if (fullText.contains("purchase invoice") || fullText.contains("purchase bill") || fullText.contains("vendor bill") || (hasSupplier && hasInvoice)) {
            return new ClassificationResult("PURCHASE_INVOICE", 0.96);
        }

        if (fullText.contains("sales invoice") || fullText.contains("sales bill") || fullText.contains("tax invoice") || fullText.contains("cash receipt") || (hasCustomer && hasInvoice)) {
            return new ClassificationResult("SALES_INVOICE", 0.94);
        }

        if (fullText.contains("medicine list") || fullText.contains("item master") || fullText.contains("inventory list") || fullText.contains("stock list") || fullText.contains("catalog")) {
            return new ClassificationResult("MEDICINE_MASTER", 0.92);
        }

        if (fileName.toLowerCase().endsWith(".csv")) {
            if (fullText.contains("purchase") || hasSupplier) {
                return new ClassificationResult("PURCHASE_CSV", 0.90);
            }
            if (fullText.contains("sale") || hasCustomer) {
                return new ClassificationResult("SALES_CSV", 0.90);
            }
            return new ClassificationResult("MEDICINE_MASTER", 0.85);
        }

        return new ClassificationResult(hasSupplier ? "PURCHASE_INVOICE" : (hasCustomer ? "SALES_INVOICE" : "MEDICINE_MASTER"), 0.75);
    }

    private boolean isPurchaseType(String docType) {
        if (docType == null) return false;
        String t = docType.toUpperCase();
        return t.contains("PURCHASE") || t.equals("PURCHASE_INVOICE") || t.equals("PURCHASE_CSV");
    }

    private boolean isSaleType(String docType) {
        if (docType == null) return false;
        String t = docType.toUpperCase();
        return t.contains("SALE") || t.equals("SALES_INVOICE") || t.equals("SALES_CSV");
    }

    private Item findFuzzyMatch(String name, List<Item> items) {
        String clean = normalizeMedicineName(name);
        for (Item i : items) {
            String existingClean = normalizeMedicineName(i.getName());
            if (existingClean.contains(clean) || clean.contains(existingClean)) {
                return i;
            }
        }
        return null;
    }

    private String normalizeMedicineName(String name) {
        if (name == null) return "";
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]", "")
                .trim();
    }

    private void updateItemStatus(Item item) {
        int qty = item.getQuantity() != null ? item.getQuantity() : 0;
        if (qty <= 0) {
            item.setStatus("Out of Stock");
        } else if (qty <= 50) {
            item.setStatus("Low Stock");
        } else {
            item.setStatus("In Stock");
        }
    }

    private String generateMedicineCode(String name) {
        int hash = Math.abs(name != null ? name.hashCode() : (int) System.currentTimeMillis());
        return String.format("%04d-%04d", (hash / 10000) % 10000, hash % 10000);
    }

    private String getFileExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        return idx > 0 ? filename.substring(idx + 1).toLowerCase() : "";
    }

    private String sanitizeFilename(String filename) {
        return filename.replaceAll("[^a-zA-Z0-9._\\-]", "_");
    }
}
