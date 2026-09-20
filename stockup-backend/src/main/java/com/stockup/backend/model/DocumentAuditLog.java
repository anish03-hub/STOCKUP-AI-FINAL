package com.stockup.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Audit log recording every document-driven database modification.
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "document_audit_logs")
public class DocumentAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "business_id", nullable = false)
    private String businessId;

    @Column(name = "document_id")
    private String documentId;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "file_name")
    private String fileName;

    @Column(nullable = false)
    private String action; // MEDICINE_MASTER_IMPORT, PURCHASE_INVOICE_IMPORT, SALES_INVOICE_IMPORT

    private Integer recordsCount;
    private Integer createdCount;
    private Integer updatedCount;
    private Integer failedCount;

    @Column(nullable = false)
    private String status; // SUCCESS, PARTIAL, FAILED

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
