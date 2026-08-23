package com.stockup.backend.service;

import com.stockup.backend.dto.DynamicReorderResponse;
import com.stockup.backend.dto.ReorderRequest;
import com.stockup.backend.dto.ReorderResponse;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;

/**
 * Reorder Optimization Service — Dynamic Safety Stock implementation.
 *
 * ──────────────────────────────────────────────────────────────────
 * DYNAMIC SAFETY STOCK FORMULA
 * ──────────────────────────────────────────────────────────────────
 *
 *   Safety Stock = Z × σ_demand × √(leadTimeHours)
 *
 * Where:
 *   Z           = service-level z-score
 *                 0.90 → 1.282 | 0.95 → 1.645 | 0.99 → 2.326
 *   σ_demand    = sample std dev of hourly demand (from saleshourly.csv)
 *   leadTimeHours = hours from order placement to receipt (configurable)
 *
 * This replaces the previous hardcoded 20% buffer which was identical
 * for every medicine and ignored all demand variability information.
 *
 * ──────────────────────────────────────────────────────────────────
 * REORDER POINT FORMULA
 * ──────────────────────────────────────────────────────────────────
 *
 *   expectedLeadTimeDemand = avgDemand × leadTimeHours
 *   reorderPoint           = expectedLeadTimeDemand + safetyStock
 *
 * ──────────────────────────────────────────────────────────────────
 * REORDER QUANTITY FORMULA
 * ──────────────────────────────────────────────────────────────────
 *
 *   targetStock    = reorderPoint + predictedDemand
 *   reorderQty     = max(0, targetStock − currentStock)
 *   estimatedCost  = reorderQty × unitPrice
 *
 * ──────────────────────────────────────────────────────────────────
 * LEAD-TIME ASSUMPTION
 * ──────────────────────────────────────────────────────────────────
 *
 *   The Item entity does not store supplier lead time.
 *   The configurable default is used (reorder.default.lead-time-hours).
 *   Callers can override per-request via ReorderRequest.leadTimeHours.
 *   The lead-time used is always returned in the response for transparency.
 *
 * ──────────────────────────────────────────────────────────────────
 * HISTORICAL DEMAND SOURCE
 * ──────────────────────────────────────────────────────────────────
 *
 *   saleshourly.csv — 50,532 hourly demand observations per product code.
 *   Statistics are pre-computed at application startup by DemandStatisticsService.
 *   The CSV is never modified.
 */
@Service
public class ReorderOptimizationService {

    private static final Logger logger = LoggerFactory.getLogger(ReorderOptimizationService.class);

    /** Configurable default lead time from application.properties */
    @Value("${reorder.default.lead-time-hours:24}")
    private int defaultLeadTimeHours;

    /** Configurable default service level from application.properties */
    @Value("${reorder.default.service-level:0.95}")
    private double defaultServiceLevel;

    private final ItemRepository itemRepository;
    private final DemandStatisticsService demandStatisticsService;

    @Autowired
    public ReorderOptimizationService(ItemRepository itemRepository,
                                      DemandStatisticsService demandStatisticsService) {
        this.itemRepository = itemRepository;
        this.demandStatisticsService = demandStatisticsService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIMARY PUBLIC METHOD
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Calculate dynamic reorder optimization for a named medicine.
     *
     * @param request must include medicineName and predictedDemand;
     *                optionally leadTimeHours and serviceLevel
     * @return DynamicReorderResponse with full calculation breakdown
     */
    public DynamicReorderResponse optimizeReorder(ReorderRequest request) {
        // 1. Resolve effective parameters
        double leadTimeHours = request.getLeadTimeHours() != null
                ? request.getLeadTimeHours()
                : defaultLeadTimeHours;
        double serviceLevel = request.getServiceLevel() != null
                ? request.getServiceLevel()
                : defaultServiceLevel;
        double zScore = resolveZScore(serviceLevel);
        int predictedDemand = request.getPredictedDemand();

        // 2. Look up medicine in PostgreSQL
        Optional<Item> optionalItem = itemRepository.findByNameIgnoreCase(request.getMedicineName());

        // 3. Resolve historical demand statistics from saleshourly.csv
        //    (try to match Item.code to a supported product code)
        String productCode = null;
        double avgDemand = 0.0;
        double demandStdDev = 0.0;
        int observations = 0;
        boolean historicalDataAvailable = false;

        if (optionalItem.isPresent() && optionalItem.get().getCode() != null) {
            productCode = optionalItem.get().getCode().trim().toUpperCase(Locale.ROOT);
            Optional<DemandStatisticsService.DemandStats> stats = demandStatisticsService.getStats(productCode);
            if (stats.isPresent()) {
                avgDemand = stats.get().averageDemand();
                demandStdDev = stats.get().demandStdDev();
                observations = stats.get().observationCount();
                historicalDataAvailable = true;
                logger.info("Historical demand stats for {} ({}): avg={}, sigma={}, n={}",
                        request.getMedicineName(), productCode,
                        String.format("%.4f", avgDemand),
                        String.format("%.4f", demandStdDev),
                        observations);
            } else {
                logger.info("No historical demand data for product code '{}'. Using zero variability.", productCode);
            }
        } else if (!optionalItem.isPresent()) {
            logger.info("Medicine '{}' not found in PostgreSQL. Proceeding with generic calculation.",
                    request.getMedicineName());
        }

        // 4. Calculate dynamic safety stock
        //    Safety Stock = Z × σ_demand × √(leadTimeHours)
        double safetyStock = zScore * demandStdDev * Math.sqrt(leadTimeHours);
        safetyStock = Math.max(0.0, safetyStock); // never negative

        // 5. Calculate expected lead-time demand
        //    Expected Lead-Time Demand = avgDemand × leadTimeHours
        double expectedLeadTimeDemand = avgDemand * leadTimeHours;

        // 6. Calculate reorder point
        //    Reorder Point = expectedLeadTimeDemand + safetyStock
        double reorderPoint = expectedLeadTimeDemand + safetyStock;

        // 7. Calculate target stock and reorder quantity
        //    Target Stock = reorderPoint + predictedDemand
        //    Reorder Qty  = max(0, targetStock - currentStock)
        double targetStock = reorderPoint + predictedDemand;
        int currentStock = 0;
        double unitPrice = 0.0;
        String itemName = request.getMedicineName();
        boolean itemFound = false;

        if (optionalItem.isPresent()) {
            Item item = optionalItem.get();
            currentStock = item.getQuantity() != null ? item.getQuantity() : 0;
            unitPrice = item.getPrice() != null ? item.getPrice() : 0.0;
            itemName = item.getName();
            itemFound = true;
        }

        int reorderQuantity = (int) Math.max(0, Math.ceil(targetStock - currentStock));
        double estimatedCost = reorderQuantity * unitPrice;

        // 8. Build response
        DynamicReorderResponse response = new DynamicReorderResponse();
        response.setMedicineName(itemName);
        response.setProductCode(productCode);
        response.setItemFound(itemFound);
        response.setCurrentStock(currentStock);
        response.setPredictedDemand(predictedDemand);

        // Historical demand stats
        response.setAverageDemand(avgDemand);
        response.setDemandStdDev(demandStdDev);
        response.setHistoricalObservations(observations);
        response.setHistoricalDataAvailable(historicalDataAvailable);

        // Safety-stock parameters
        response.setLeadTimeHours(leadTimeHours);
        response.setServiceLevel(serviceLevel);
        response.setzScore(zScore);

        // Calculated fields
        response.setSafetyStock(safetyStock);
        response.setExpectedLeadTimeDemand(expectedLeadTimeDemand);
        response.setReorderPoint(reorderPoint);
        response.setTargetStock(targetStock);
        response.setReorderQuantity(reorderQuantity);

        // Financial
        response.setUnitPrice(unitPrice);
        response.setEstimatedCost(estimatedCost);

        // Explanation note
        response.setCalculationNote(buildExplanation(historicalDataAvailable, demandStdDev,
                leadTimeHours, serviceLevel, zScore, safetyStock));

        logger.info("Reorder result for '{}': safetyStock={}, reorderPoint={}, targetStock={}, reorderQty={}, cost={}",
                itemName,
                String.format("%.2f", safetyStock),
                String.format("%.2f", reorderPoint),
                String.format("%.2f", targetStock),
                reorderQuantity,
                String.format("%.2f", estimatedCost));

        return response;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BACKWARD COMPATIBILITY SHIM
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns a legacy ReorderResponse for code that depends on the old DTO.
     * The safety-stock value is now dynamically calculated instead of the
     * old hardcoded 20% buffer.
     *
     * @deprecated Use optimizeReorder(ReorderRequest) which returns DynamicReorderResponse.
     */
    @Deprecated
    public ReorderResponse optimizeReorderLegacy(ReorderRequest request) {
        DynamicReorderResponse dynamic = optimizeReorder(request);
        ReorderResponse legacy = new ReorderResponse();
        legacy.setMedicineName(dynamic.getMedicineName());
        legacy.setItemFound(dynamic.isItemFound());
        legacy.setCurrentStock(dynamic.getCurrentStock());
        legacy.setPredictedDemand(dynamic.getPredictedDemand());
        legacy.setSafetyStock(dynamic.getSafetyStockInt());
        legacy.setTargetStock((int) Math.ceil(dynamic.getTargetStock()));
        legacy.setReorderQuantity(dynamic.getReorderQuantity());
        legacy.setUnitPrice(dynamic.getUnitPrice());
        legacy.setTotalEstimatedCost(dynamic.getEstimatedCost());
        return legacy;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Resolve the Z-score for a given service level.
     * Standard normal distribution quantiles:
     *   90% → 1.282   95% → 1.645   99% → 2.326
     */
    static double resolveZScore(double serviceLevel) {
        if (serviceLevel >= 0.99) return 2.326;
        if (serviceLevel >= 0.97) return 1.880;
        if (serviceLevel >= 0.95) return 1.645;
        if (serviceLevel >= 0.92) return 1.405;
        if (serviceLevel >= 0.90) return 1.282;
        if (serviceLevel >= 0.85) return 1.036;
        return 1.282; // safe default: 90%
    }

    private String buildExplanation(boolean hasHistory, double stdDev,
                                    double leadTime, double sl, double z, double ss) {
        if (!hasHistory) {
            return String.format(
                    "No historical demand data available for this medicine. " +
                    "Safety stock defaulted to 0 (no variability assumed). " +
                    "Lead time: %.0fh, Service level: %.0f%%, Z=%.3f.",
                    leadTime, sl * 100, z);
        }
        String trend = stdDev > 1.0 ? "high demand variability" :
                       stdDev > 0.5 ? "moderate demand variability" : "low demand variability";
        return String.format(
                "Safety stock calculated using: Z(%.0f%%) × σ × √(LT) = %.3f × %.4f × √(%.0f) = %.2f units. " +
                "Demand shows %s (σ=%.4f). " +
                "Higher variability, longer lead time, or higher service level each increase safety stock.",
                sl * 100, z, stdDev, leadTime, ss, trend, stdDev);
    }
}
