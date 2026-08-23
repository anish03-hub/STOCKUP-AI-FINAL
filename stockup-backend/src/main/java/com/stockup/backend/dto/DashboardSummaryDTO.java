package com.stockup.backend.dto;

import java.util.List;

public class DashboardSummaryDTO {
    private double totalInventoryValue;
    private int totalItems;
    private int lowStockItemsCount;
    private int criticalExpiryItemsCount;
    private double spoilageRiskValue;
    private List<ActionItemDTO> actionItems;

    public DashboardSummaryDTO() {}

    public DashboardSummaryDTO(double totalInventoryValue, int totalItems, int lowStockItemsCount,
                               int criticalExpiryItemsCount, double spoilageRiskValue, List<ActionItemDTO> actionItems) {
        this.totalInventoryValue = totalInventoryValue;
        this.totalItems = totalItems;
        this.lowStockItemsCount = lowStockItemsCount;
        this.criticalExpiryItemsCount = criticalExpiryItemsCount;
        this.spoilageRiskValue = spoilageRiskValue;
        this.actionItems = actionItems;
    }

    // Getters and Setters
    public double getTotalInventoryValue() { return totalInventoryValue; }
    public void setTotalInventoryValue(double totalInventoryValue) { this.totalInventoryValue = totalInventoryValue; }

    public int getTotalItems() { return totalItems; }
    public void setTotalItems(int totalItems) { this.totalItems = totalItems; }

    public int getLowStockItemsCount() { return lowStockItemsCount; }
    public void setLowStockItemsCount(int lowStockItemsCount) { this.lowStockItemsCount = lowStockItemsCount; }

    public int getCriticalExpiryItemsCount() { return criticalExpiryItemsCount; }
    public void setCriticalExpiryItemsCount(int criticalExpiryItemsCount) { this.criticalExpiryItemsCount = criticalExpiryItemsCount; }

    public double getSpoilageRiskValue() { return spoilageRiskValue; }
    public void setSpoilageRiskValue(double spoilageRiskValue) { this.spoilageRiskValue = spoilageRiskValue; }

    public List<ActionItemDTO> getActionItems() { return actionItems; }
    public void setActionItems(List<ActionItemDTO> actionItems) { this.actionItems = actionItems; }
}
