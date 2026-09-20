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
public class InvoiceDTO {
    private String invoiceNumber;
    private String transactionId;
    private String businessName;
    private String businessId;
    private String customerName;
    private String customerPhone;
    private String paymentMethod;
    private String itemId;
    private String itemCode;
    private String itemName;
    private Integer quantity;
    private Double unitPrice;
    private Double totalAmount;
    private String currency;
    private Double exchangeRate;
    private Double transactionAmount;
    private Integer remainingStock;
    private String createdBy;
    private LocalDateTime createdAt;
    private String notes;

    @com.fasterxml.jackson.annotation.JsonProperty("medicineName")
    public String getMedicineName() {
        return itemName;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("cashierEmail")
    public String getCashierEmail() {
        return createdBy;
    }
}
