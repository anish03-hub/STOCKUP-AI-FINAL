package com.stockup.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * PurchaseOrder entity backing the procurement & replenishment lifecycle.
 * Persisted in PostgreSQL table "purchase_orders".
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String poNumber;

    private String itemId;
    private String itemCode;
    private String itemName;

    private String supplierId;
    private String supplierName;

    private Integer quantityOrdered;
    private Double unitPrice;
    private Double totalAmount;

    private String priority; // "Low", "Medium", "High", "Urgent"

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PurchaseOrderStatus status; // DRAFT, SUBMITTED, RECEIVED, CANCELLED

    private String expectedDeliveryDate; // YYYY-MM-DD

    @Column(name = "business_id")
    private String businessId;

    private LocalDateTime createdAt;

    private LocalDateTime receivedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = PurchaseOrderStatus.SUBMITTED;
        }
    }
}
