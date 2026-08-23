package com.stockup.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for medicine hourly demand prediction.
 */
public class MedicineDemandPredictionRequest {

    @NotBlank(message = "Product code is required")
    private String productCode;

    public MedicineDemandPredictionRequest() {
    }

    public MedicineDemandPredictionRequest(String productCode) {
        this.productCode = productCode;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }
}
