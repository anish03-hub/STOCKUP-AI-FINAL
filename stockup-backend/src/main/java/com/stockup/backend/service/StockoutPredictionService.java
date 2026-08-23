package com.stockup.backend.service;

import com.stockup.backend.dto.StockoutRequest;
import com.stockup.backend.dto.StockoutResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service for stock-out risk prediction.
 * Pure calculation — no database queries, no ML API calls.
 *
 * Stock Coverage Ratio = currentQuantity / predictedDemand
 *   < 0.5  → HIGH risk
 *   < 1.0  → MEDIUM risk
 *   >= 1.0 → LOW risk
 */
@Service
public class StockoutPredictionService {

    private static final Logger logger = LoggerFactory.getLogger(StockoutPredictionService.class);

    /**
     * Calculate stock-out risk based on current quantity and predicted demand.
     *
     * @param request StockoutRequest containing medicineName, currentQuantity, predictedDemand
     * @return StockoutResponse with full risk analysis
     */
    public StockoutResponse calculateStockoutRisk(StockoutRequest request) {
        int currentQuantity = request.getCurrentQuantity();
        int predictedDemand = request.getPredictedDemand();

        logger.info("Calculating stock-out risk for '{}': currentQty={}, predictedDemand={}",
                request.getMedicineName(), currentQuantity, predictedDemand);

        // Core calculation
        double stockCoverageRatio = (double) currentQuantity / predictedDemand;
        int expectedShortage = currentQuantity - predictedDemand;

        // Determine risk level and recommendation
        String riskLevel;
        String recommendation;

        if (stockCoverageRatio < 0.5) {
            riskLevel = "HIGH";
            recommendation = String.format(
                    "CRITICAL: Current stock covers only %.1f%% of predicted demand. "
                    + "Reorder immediately to avoid stock-out.",
                    stockCoverageRatio * 100);
        } else if (stockCoverageRatio < 1.0) {
            riskLevel = "MEDIUM";
            recommendation = String.format(
                    "Current stock covers %.1f%% of predicted demand but falls short by %d units. "
                    + "Plan reorder soon to prevent shortage.",
                    stockCoverageRatio * 100, Math.abs(expectedShortage));
        } else {
            riskLevel = "LOW";
            recommendation = String.format(
                    "Stock level adequate. Current stock exceeds predicted demand by %d units (%.1f%% coverage).",
                    expectedShortage, stockCoverageRatio * 100);
        }

        logger.info("Stock-out result for '{}': ratio={}, risk={}", 
                request.getMedicineName(), 
                String.format("%.4f", stockCoverageRatio), riskLevel);

        // Round the ratio for clean JSON output
        double roundedRatio = Math.round(stockCoverageRatio * 10000.0) / 10000.0;

        return new StockoutResponse(
                request.getMedicineName() != null ? request.getMedicineName() : "N/A",
                currentQuantity,
                predictedDemand,
                expectedShortage,
                roundedRatio,
                riskLevel,
                recommendation
        );
    }
}
