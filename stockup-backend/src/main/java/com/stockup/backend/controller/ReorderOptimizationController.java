package com.stockup.backend.controller;

import com.stockup.backend.dto.DynamicReorderResponse;
import com.stockup.backend.dto.ReorderRequest;
import com.stockup.backend.service.ReorderOptimizationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for reorder optimization with dynamic safety stock.
 *
 * POST /api/reorder/calculate
 *   Calculates reorder quantity using:
 *     - Historical demand variability from saleshourly.csv
 *     - Configurable service level (default 95%)
 *     - Configurable lead time (default 24h)
 *     - Dynamic safety stock formula: Z × σ × √(leadTime)
 */
@RestController
@RequestMapping("/api/reorder")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ReorderOptimizationController {

    private final ReorderOptimizationService reorderOptimizationService;

    @Autowired
    public ReorderOptimizationController(ReorderOptimizationService reorderOptimizationService) {
        this.reorderOptimizationService = reorderOptimizationService;
    }

    /**
     * Calculate reorder optimization with dynamic safety stock.
     *
     * @param request medicineName + predictedDemand (required),
     *                leadTimeHours + serviceLevel (optional overrides)
     * @return DynamicReorderResponse with full breakdown of safety-stock calculation
     */
    @PostMapping("/calculate")
    public ResponseEntity<DynamicReorderResponse> calculateReorder(
            @Valid @RequestBody ReorderRequest request) {

        DynamicReorderResponse response = reorderOptimizationService.optimizeReorder(request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
