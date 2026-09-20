package com.stockup.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderRequest {

    private String itemId;
    private String itemCode;
    private String itemName;

    private String supplierId;
    private String supplierName;

    @NotNull(message = "Quantity ordered is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantityOrdered;

    @NotNull(message = "Unit price is required")
    @Min(value = 0, message = "Unit price must be non-negative")
    private Double unitPrice;

    private String priority; // Low, Medium, High, Urgent
    private String notes;
    private String status; // DRAFT, SUBMITTED
    private String expectedDeliveryDate; // YYYY-MM-DD
}
