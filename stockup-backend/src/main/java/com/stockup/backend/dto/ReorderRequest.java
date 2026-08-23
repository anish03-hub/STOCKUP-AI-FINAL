package com.stockup.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for reorder optimization.
 *
 * Required:
 *   medicineName   — name as stored in the items table (case-insensitive)
 *   predictedDemand — estimated demand for the coverage period (user-supplied)
 *
 * Optional (fall back to application.properties defaults if omitted):
 *   leadTimeHours  — hours from placing to receiving an order (default: 24h)
 *   serviceLevel   — desired service level: 0.90, 0.95, or 0.99 (default: 0.95)
 */
public class ReorderRequest {

    @NotBlank(message = "Medicine name is required")
    private String medicineName;

    @NotNull(message = "Predicted demand is required")
    @Min(value = 1, message = "Predicted demand must be > 0")
    private Integer predictedDemand;

    /**
     * Optional override for lead time in hours.
     * If null, the value from application.properties (reorder.default.lead-time-hours) is used.
     * Minimum 1 hour.
     */
    @Min(value = 1, message = "Lead time must be at least 1 hour")
    private Integer leadTimeHours;

    /**
     * Optional override for service level.
     * If null, the value from application.properties (reorder.default.service-level) is used.
     * Supported values: 0.90, 0.95, 0.99
     */
    @DecimalMin(value = "0.80", message = "Service level must be at least 0.80")
    @DecimalMax(value = "0.999", message = "Service level must be at most 0.999")
    private Double serviceLevel;

    public ReorderRequest() {}

    public ReorderRequest(String medicineName, Integer predictedDemand) {
        this.medicineName = medicineName;
        this.predictedDemand = predictedDemand;
    }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public Integer getPredictedDemand() { return predictedDemand; }
    public void setPredictedDemand(Integer predictedDemand) { this.predictedDemand = predictedDemand; }

    public Integer getLeadTimeHours() { return leadTimeHours; }
    public void setLeadTimeHours(Integer leadTimeHours) { this.leadTimeHours = leadTimeHours; }

    public Double getServiceLevel() { return serviceLevel; }
    public void setServiceLevel(Double serviceLevel) { this.serviceLevel = serviceLevel; }
}
