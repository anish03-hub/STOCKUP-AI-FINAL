package com.stockup.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Extended reorder optimization response that exposes the full
 * dynamic safety-stock calculation so the user can understand
 * exactly how every figure was derived.
 *
 * Formula:
 *   Safety Stock       = Z × demandStdDev × √(leadTimeHours)
 *   ExpectedLeadDemand = averageDemand × leadTimeHours
 *   Reorder Point      = expectedLeadTimeDemand + safetyStock
 *   Target Stock       = reorderPoint + predictedDemand
 *   Reorder Quantity   = max(0, targetStock - currentStock)
 *   Estimated Cost     = reorderQuantity × unitPrice
 *
 * Historical demand source: saleshourly.csv (50,532 hourly observations)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DynamicReorderResponse {

    // ── Medicine identification ─────────────────────────────────────────────────
    private String medicineName;
    private String productCode;
    private boolean itemFound;

    // ── Inventory ───────────────────────────────────────────────────────────────
    private int currentStock;

    // ── Historical demand statistics (from saleshourly.csv) ────────────────────
    /** Mean hourly demand computed from all historical observations. */
    private double averageDemand;
    /** Sample standard deviation of hourly demand. */
    private double demandStdDev;
    /** Number of historical observations used. */
    private int historicalObservations;
    /** Whether historical data was available for this product code. */
    private boolean historicalDataAvailable;

    // ── Safety-stock parameters ─────────────────────────────────────────────────
    /** Lead time in hours (configurable default, documented assumption). */
    private double leadTimeHours;
    /** Service level used (e.g. 0.95 = 95%). */
    private double serviceLevel;
    /** Z-score corresponding to the chosen service level. */
    private double zScore;

    // ── Calculated safety-stock fields ─────────────────────────────────────────
    /**
     * Dynamic Safety Stock = Z × σ_demand × √(leadTimeHours).
     * This is the buffer held against demand variability during lead time.
     */
    private double safetyStock;

    /**
     * Expected demand to be consumed during the lead time
     * = averageDemand × leadTimeHours.
     */
    private double expectedLeadTimeDemand;

    /**
     * Reorder Point = expectedLeadTimeDemand + safetyStock.
     * When current stock falls to this level, a reorder should be placed.
     */
    private double reorderPoint;

    // ── Reorder calculation ─────────────────────────────────────────────────────
    /** Predicted demand for the order coverage period (user-supplied). */
    private int predictedDemand;

    /**
     * Target Stock = reorderPoint + predictedDemand.
     * The stock level to bring inventory up to after receiving a delivery.
     */
    private double targetStock;

    /**
     * Reorder Quantity = max(0, targetStock - currentStock).
     * Units to order now.
     */
    private int reorderQuantity;

    // ── Financial ───────────────────────────────────────────────────────────────
    private double unitPrice;
    private double estimatedCost;

    /** Human-readable explanation of how safety stock was calculated. */
    private String calculationNote;

    public double getzScore() { return zScore; }
    public void setzScore(double zScore) { this.zScore = zScore; }

    // Legacy compat — kept for any existing code that calls getTotalEstimatedCost()
    public double getTotalEstimatedCost() { return estimatedCost; }

    // Legacy compat — safetyStock rounded to int for old UI code
    public int getSafetyStockInt() { return (int) Math.ceil(safetyStock); }
}


