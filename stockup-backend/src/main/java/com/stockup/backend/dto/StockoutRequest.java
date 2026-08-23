package com.stockup.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for stock-out prediction.
 * Contains medicine info and stock/demand values for risk calculation.
 */
public class StockoutRequest {

    private String medicineName;

    @NotNull(message = "Current quantity is required")
    @Min(value = 0, message = "Current quantity must be >= 0")
    private Integer currentQuantity;

    @NotNull(message = "Predicted demand is required")
    @Min(value = 1, message = "Predicted demand must be > 0")
    private Integer predictedDemand;

    // Constructors
    public StockoutRequest() {
    }

    public StockoutRequest(String medicineName, Integer currentQuantity, Integer predictedDemand) {
        this.medicineName = medicineName;
        this.currentQuantity = currentQuantity;
        this.predictedDemand = predictedDemand;
    }

    // Getters and Setters
    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public Integer getCurrentQuantity() {
        return currentQuantity;
    }

    public void setCurrentQuantity(Integer currentQuantity) {
        this.currentQuantity = currentQuantity;
    }

    public Integer getPredictedDemand() {
        return predictedDemand;
    }

    public void setPredictedDemand(Integer predictedDemand) {
        this.predictedDemand = predictedDemand;
    }
}
