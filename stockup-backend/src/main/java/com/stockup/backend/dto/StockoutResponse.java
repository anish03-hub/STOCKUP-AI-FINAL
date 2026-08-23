package com.stockup.backend.dto;

/**
 * Response DTO for stock-out prediction.
 * Contains the full stock-out risk analysis result.
 */
public class StockoutResponse {

    private String medicineName;
    private int currentStock;
    private int predictedDemand;
    private int expectedShortage;
    private double stockCoverageRatio;
    private String riskLevel;
    private String recommendation;

    // Constructors
    public StockoutResponse() {
    }

    public StockoutResponse(String medicineName, int currentStock, int predictedDemand,
                            int expectedShortage, double stockCoverageRatio,
                            String riskLevel, String recommendation) {
        this.medicineName = medicineName;
        this.currentStock = currentStock;
        this.predictedDemand = predictedDemand;
        this.expectedShortage = expectedShortage;
        this.stockCoverageRatio = stockCoverageRatio;
        this.riskLevel = riskLevel;
        this.recommendation = recommendation;
    }

    // Getters and Setters
    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public int getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(int currentStock) {
        this.currentStock = currentStock;
    }

    public int getPredictedDemand() {
        return predictedDemand;
    }

    public void setPredictedDemand(int predictedDemand) {
        this.predictedDemand = predictedDemand;
    }

    public int getExpectedShortage() {
        return expectedShortage;
    }

    public void setExpectedShortage(int expectedShortage) {
        this.expectedShortage = expectedShortage;
    }

    public double getStockCoverageRatio() {
        return stockCoverageRatio;
    }

    public void setStockCoverageRatio(double stockCoverageRatio) {
        this.stockCoverageRatio = stockCoverageRatio;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }
}
