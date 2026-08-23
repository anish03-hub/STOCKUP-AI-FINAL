package com.stockup.backend.dto;

public class ExpiryItemDetails {
    private String medicineName;
    private String category;
    private String manufacturer;
    private int quantity;
    private double price;
    private String expiryDate;
    private long daysUntilExpiry;
    private String riskLevel; // CRITICAL, WARNING, SAFE
    private double financialRisk;

    public ExpiryItemDetails() {}

    public ExpiryItemDetails(String medicineName, String category, String manufacturer, int quantity, 
                             double price, String expiryDate, long daysUntilExpiry, String riskLevel, double financialRisk) {
        this.medicineName = medicineName;
        this.category = category;
        this.manufacturer = manufacturer;
        this.quantity = quantity;
        this.price = price;
        this.expiryDate = expiryDate;
        this.daysUntilExpiry = daysUntilExpiry;
        this.riskLevel = riskLevel;
        this.financialRisk = financialRisk;
    }

    // Getters and Setters
    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }
    public long getDaysUntilExpiry() { return daysUntilExpiry; }
    public void setDaysUntilExpiry(long daysUntilExpiry) { this.daysUntilExpiry = daysUntilExpiry; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public double getFinancialRisk() { return financialRisk; }
    public void setFinancialRisk(double financialRisk) { this.financialRisk = financialRisk; }
}
