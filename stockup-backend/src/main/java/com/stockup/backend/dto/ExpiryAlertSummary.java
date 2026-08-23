package com.stockup.backend.dto;

import java.util.List;

public class ExpiryAlertSummary {
    private int totalCriticalItems; // < 30 days
    private int totalWarningItems; // 31-90 days
    private int totalSafeItems; // > 90 days
    private double totalAtRiskValue; // Sum of price * quantity for CRITICAL and WARNING
    
    private List<ExpiryItemDetails> atRiskItems; // List of only CRITICAL and WARNING items for UI rendering

    public ExpiryAlertSummary() {}

    public ExpiryAlertSummary(int totalCriticalItems, int totalWarningItems, int totalSafeItems, 
                              double totalAtRiskValue, List<ExpiryItemDetails> atRiskItems) {
        this.totalCriticalItems = totalCriticalItems;
        this.totalWarningItems = totalWarningItems;
        this.totalSafeItems = totalSafeItems;
        this.totalAtRiskValue = totalAtRiskValue;
        this.atRiskItems = atRiskItems;
    }

    public int getTotalCriticalItems() { return totalCriticalItems; }
    public void setTotalCriticalItems(int totalCriticalItems) { this.totalCriticalItems = totalCriticalItems; }
    
    public int getTotalWarningItems() { return totalWarningItems; }
    public void setTotalWarningItems(int totalWarningItems) { this.totalWarningItems = totalWarningItems; }
    
    public int getTotalSafeItems() { return totalSafeItems; }
    public void setTotalSafeItems(int totalSafeItems) { this.totalSafeItems = totalSafeItems; }
    
    public double getTotalAtRiskValue() { return totalAtRiskValue; }
    public void setTotalAtRiskValue(double totalAtRiskValue) { this.totalAtRiskValue = totalAtRiskValue; }
    
    public List<ExpiryItemDetails> getAtRiskItems() { return atRiskItems; }
    public void setAtRiskItems(List<ExpiryItemDetails> atRiskItems) { this.atRiskItems = atRiskItems; }
}
