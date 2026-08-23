package com.stockup.backend.dto;

/**
 * Response DTO for demand prediction.
 */
public class PredictionResponse {

    private Double predictedDemand;
    private String model;

    // Constructors
    public PredictionResponse() {
    }

    public PredictionResponse(Double predictedDemand, String model) {
        this.predictedDemand = predictedDemand;
        this.model = model;
    }

    // Getters and Setters
    public Double getPredictedDemand() {
        return predictedDemand;
    }

    public void setPredictedDemand(Double predictedDemand) {
        this.predictedDemand = predictedDemand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }
}
