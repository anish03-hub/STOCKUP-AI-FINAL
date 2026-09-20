package com.stockup.backend.dto;

/**
 * Response for the Lead Time Prediction Module.
 * Predicts expected delivery lead time (days) for a supplier together with a
 * confidence interval derived from historical mean and variability.
 */
public class LeadTimePredictionResponse {

    private String supplierId;
    private String supplierName;
    private double predictedLeadTimeDays;   // expected lead time
    private double lowerBoundDays;          // interval lower bound
    private double upperBoundDays;          // interval upper bound (planning value)
    private double serviceLevel;            // e.g. 0.95
    private String riskLevel;               // LOW | MEDIUM | HIGH (variability)
    private String method;                  // description of the model used
    private String explanation;

    public LeadTimePredictionResponse() {
    }

    public String getSupplierId() { return supplierId; }
    public void setSupplierId(String supplierId) { this.supplierId = supplierId; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public double getPredictedLeadTimeDays() { return predictedLeadTimeDays; }
    public void setPredictedLeadTimeDays(double v) { this.predictedLeadTimeDays = v; }

    public double getLowerBoundDays() { return lowerBoundDays; }
    public void setLowerBoundDays(double v) { this.lowerBoundDays = v; }

    public double getUpperBoundDays() { return upperBoundDays; }
    public void setUpperBoundDays(double v) { this.upperBoundDays = v; }

    public double getServiceLevel() { return serviceLevel; }
    public void setServiceLevel(double v) { this.serviceLevel = v; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
}
