package com.stockup.backend.dto;

/**
 * A single ranked supplier recommendation, returned by
 * SupplierRecommendationService. Score is 0..100 (higher is better) with a
 * transparent breakdown of each contributing factor so the ranking is
 * explainable rather than a black box.
 */
public class SupplierRecommendationDTO {

    private String supplierId;
    private String name;
    private int rank;
    private double score;            // 0..100 composite

    // Normalised sub-scores (0..100) that make up the composite
    private double costScore;
    private double leadTimeScore;
    private double reliabilityScore;
    private double performanceScore;

    // Raw values for display
    private Double unitCost;
    private Double avgLeadTimeDays;
    private Double leadTimeStdDevDays;
    private Double rawPerformanceScore;

    private String reason;           // human-readable justification

    public SupplierRecommendationDTO() {
    }

    public String getSupplierId() { return supplierId; }
    public void setSupplierId(String supplierId) { this.supplierId = supplierId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }

    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }

    public double getCostScore() { return costScore; }
    public void setCostScore(double costScore) { this.costScore = costScore; }

    public double getLeadTimeScore() { return leadTimeScore; }
    public void setLeadTimeScore(double leadTimeScore) { this.leadTimeScore = leadTimeScore; }

    public double getReliabilityScore() { return reliabilityScore; }
    public void setReliabilityScore(double reliabilityScore) { this.reliabilityScore = reliabilityScore; }

    public double getPerformanceScore() { return performanceScore; }
    public void setPerformanceScore(double performanceScore) { this.performanceScore = performanceScore; }

    public Double getUnitCost() { return unitCost; }
    public void setUnitCost(Double unitCost) { this.unitCost = unitCost; }

    public Double getAvgLeadTimeDays() { return avgLeadTimeDays; }
    public void setAvgLeadTimeDays(Double avgLeadTimeDays) { this.avgLeadTimeDays = avgLeadTimeDays; }

    public Double getLeadTimeStdDevDays() { return leadTimeStdDevDays; }
    public void setLeadTimeStdDevDays(Double leadTimeStdDevDays) { this.leadTimeStdDevDays = leadTimeStdDevDays; }

    public Double getRawPerformanceScore() { return rawPerformanceScore; }
    public void setRawPerformanceScore(Double rawPerformanceScore) { this.rawPerformanceScore = rawPerformanceScore; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
