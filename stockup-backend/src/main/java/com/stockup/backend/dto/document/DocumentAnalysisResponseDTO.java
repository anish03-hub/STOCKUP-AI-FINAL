package com.stockup.backend.dto.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAnalysisResponseDTO {
    private String documentId;
    private String fileName;
    private String fileType;
    private String documentType; // MEDICINE_MASTER, PURCHASE_INVOICE, SALES_INVOICE, INVENTORY_LIST, PURCHASE_CSV, SALES_CSV, UNKNOWN
    private Double confidence;
    private String status;

    private String supplierName;
    private String customerName;
    private String invoiceNumber;
    private String invoiceDate;
    private Double grandTotal;
    private String currency;

    private Integer itemsDetected;
    private Integer matchedCount;
    private Integer createdCount;
    private Integer updatedCount;
    private Integer duplicateCount;
    private Integer insufficientStockCount;

    private List<String> warnings;
    private List<DocumentItemPreviewDTO> previewItems;
    private String extractedTextPreview;

    private boolean isDuplicateInvoice;
    private String duplicateInvoiceMessage;

    private LocalDateTime processedAt;
}
