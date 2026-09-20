package com.stockup.backend.dto.billing;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSaleRequestDTO {

    private String itemId;
    private String itemCode;

    @JsonAlias({"medicineName", "medicine", "name"})
    private String itemName;

    @NotNull(message = "Quantity sold is required")
    @Min(value = 1, message = "Quantity sold must be at least 1")
    @JsonAlias({"quantity", "qty", "unitsSold"})
    private Integer quantitySold;

    private Double unitPrice; // Optional override; defaults to item sellingPrice or price
    private String customerName;
    private String customerPhone;
    private String paymentMethod; // CASH, CARD, UPI, INSURANCE
    private String notes;
    private String currency; // E.g. "INR", "USD"
    private Double exchangeRate;
    private Double transactionAmount;
}
