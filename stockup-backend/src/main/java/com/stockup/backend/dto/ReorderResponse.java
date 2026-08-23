package com.stockup.backend.dto;

public class ReorderResponse {

    private String medicineName;
    private boolean itemFound;
    private int currentStock;
    private int predictedDemand;
    private int safetyStock;
    private int targetStock;
    private int reorderQuantity;
    private double unitPrice;
    private double totalEstimatedCost;

    public ReorderResponse() {}

    public ReorderResponse(String medicineName, boolean itemFound, int currentStock, int predictedDemand,
                           int safetyStock, int targetStock, int reorderQuantity, double unitPrice, double totalEstimatedCost) {
        this.medicineName = medicineName;
        this.itemFound = itemFound;
        this.currentStock = currentStock;
        this.predictedDemand = predictedDemand;
        this.safetyStock = safetyStock;
        this.targetStock = targetStock;
        this.reorderQuantity = reorderQuantity;
        this.unitPrice = unitPrice;
        this.totalEstimatedCost = totalEstimatedCost;
    }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }
    public boolean isItemFound() { return itemFound; }
    public void setItemFound(boolean itemFound) { this.itemFound = itemFound; }
    public int getCurrentStock() { return currentStock; }
    public void setCurrentStock(int currentStock) { this.currentStock = currentStock; }
    public int getPredictedDemand() { return predictedDemand; }
    public void setPredictedDemand(int predictedDemand) { this.predictedDemand = predictedDemand; }
    public int getSafetyStock() { return safetyStock; }
    public void setSafetyStock(int safetyStock) { this.safetyStock = safetyStock; }
    public int getTargetStock() { return targetStock; }
    public void setTargetStock(int targetStock) { this.targetStock = targetStock; }
    public int getReorderQuantity() { return reorderQuantity; }
    public void setReorderQuantity(int reorderQuantity) { this.reorderQuantity = reorderQuantity; }
    public double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(double unitPrice) { this.unitPrice = unitPrice; }
    public double getTotalEstimatedCost() { return totalEstimatedCost; }
    public void setTotalEstimatedCost(double totalEstimatedCost) { this.totalEstimatedCost = totalEstimatedCost; }
}
