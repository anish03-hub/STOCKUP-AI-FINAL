package com.stockup.backend.dto.billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleResponseDTO {

    private String transactionId;
    private String invoiceNumber;
    private String itemId;
    private String itemCode;
    private String itemName;
    private Integer quantitySold;
    private Double unitPrice;
    private Double totalAmount;
    private Integer stockBefore;
    private Integer stockAfter;
    private String itemStatus; // "In Stock", "Low Stock", "Out of Stock"
    
    // Low Stock Alert Details
    private Boolean isLowStock;
    private Integer lowStockThreshold;
    private String alertMessage;
    
    // Links to connected AI pipelines
    private String suggestedReorderRoute;
    private String suggestedForecastRoute;
    
    // Audit metadata
    private String customerName;
    private String customerPhone;
    private String paymentMethod;
    private String currency;
    private Double exchangeRate;
    private Double transactionAmount;
    private String createdBy;
    private LocalDateTime createdAt;

    @com.fasterxml.jackson.annotation.JsonProperty("remainingStock")
    public Integer getRemainingStock() {
        return stockAfter;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("medicineName")
    public String getMedicineName() {
        return itemName;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("quantity")
    public Integer getQuantity() {
        return quantitySold;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isOutOfStock")
    public Boolean getIsOutOfStock() {
        return stockAfter != null && stockAfter == 0;
    }
}
