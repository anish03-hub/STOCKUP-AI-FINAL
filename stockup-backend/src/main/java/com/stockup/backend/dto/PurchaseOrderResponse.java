package com.stockup.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderResponse {

    private String id;
    private String poNumber;

    private String itemId;
    private String itemCode;
    private String itemName;

    private String supplierId;
    private String supplierName;

    private Integer quantityOrdered;
    private Double unitPrice;
    private Double totalAmount;

    private String priority;
    private String notes;
    private String status; // DRAFT, SUBMITTED, RECEIVED, CANCELLED

    private String expectedDeliveryDate;

    private LocalDateTime createdAt;
    private LocalDateTime receivedAt;
}
