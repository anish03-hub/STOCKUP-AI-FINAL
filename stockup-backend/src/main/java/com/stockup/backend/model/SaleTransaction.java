package com.stockup.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sale_transactions", indexes = {
        @Index(name = "idx_sale_tx_tenant_date", columnList = "business_id, created_at"),
        @Index(name = "idx_sale_tx_tenant_item", columnList = "business_id, item_id"),
        @Index(name = "idx_sale_tx_invoice", columnList = "invoice_number")
})
public class SaleTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "business_id", nullable = false)
    private String businessId;

    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;

    @Column(name = "item_id", nullable = false)
    private String itemId;

    @Column(name = "item_code")
    private String itemCode;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "quantity_sold", nullable = false)
    private Integer quantitySold;

    @Column(name = "unit_price", nullable = false)
    private Double unitPrice;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    @Column(name = "stock_before", nullable = false)
    private Integer stockBefore;

    @Column(name = "stock_after", nullable = false)
    private Integer stockAfter;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "payment_method")
    private String paymentMethod; // CASH, CARD, UPI, INSURANCE

    @Column(name = "notes")
    private String notes;

    @Column(name = "currency", length = 10)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "exchange_rate")
    @Builder.Default
    private Double exchangeRate = 1.0;

    @Column(name = "transaction_amount")
    private Double transactionAmount;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
