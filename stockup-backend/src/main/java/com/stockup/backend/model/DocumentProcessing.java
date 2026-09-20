package com.stockup.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing an uploaded pharmacy document (PDF / CSV)
 * undergoing AI extraction, classification, preview, and apply pipeline.
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "document_processings")
public class DocumentProcessing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "business_id", nullable = false)
    private String businessId;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type", length = 32)
    private String fileType; // PDF, CSV

    private Long fileSize;

    @Column(name = "document_type", length = 64)
    private String documentType; // MEDICINE_MASTER, PURCHASE_INVOICE, SALES_INVOICE, INVENTORY_LIST, PURCHASE_CSV, SALES_CSV, UNKNOWN

    @Column(nullable = false, length = 32)
    private String status; // UPLOADED, ANALYZING, ANALYZED, REQUIRES_REVIEW, READY_TO_APPLY, APPLIED, FAILED, CANCELLED

    private Double confidence;

    private String invoiceNumber;
    private String supplierName;
    private String customerName;
    private String invoiceDate;
    private Double grandTotal;
    private String currency;

    private Integer itemsDetected;
    private Integer createdCount;
    private Integer updatedCount;
    private Integer duplicateCount;

    @Column(name = "storage_reference")
    private String storageReference;

    @Column(name = "extracted_data_json", columnDefinition = "TEXT")
    private String extractedDataJson;

    @Column(name = "validation_result_json", columnDefinition = "TEXT")
    private String validationResultJson;

    @Column(name = "applied_summary_json", columnDefinition = "TEXT")
    private String appliedSummaryJson;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "UPLOADED";
        }
        if (currency == null) {
            currency = "USD";
        }
    }
}
