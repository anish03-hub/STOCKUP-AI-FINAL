package com.stockup.backend.controller;

import com.stockup.backend.dto.forecast.DailyForecastRequest;
import com.stockup.backend.dto.forecast.DailyForecastResponse;
import com.stockup.backend.service.DailyDemandForecastService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for multi-day daily demand forecasting powered by the
 * 177,990-row PostgreSQL daily sales dataset.
 */
@Slf4j
@RestController
@RequestMapping("/api/forecast/daily")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class DailyForecastController {

    private final DailyDemandForecastService dailyDemandForecastService;

    public DailyForecastController(DailyDemandForecastService dailyDemandForecastService) {
        this.dailyDemandForecastService = dailyDemandForecastService;
    }

    /**
     * Generate daily demand predictions for a medicine (7, 14, or 30 days).
     */
    @PostMapping("/predict")
    public ResponseEntity<DailyForecastResponse> predictDailyDemand(
            @Valid @RequestBody DailyForecastRequest request) {
        log.info("Received daily demand forecast request for medicine: {}", request.getMedicine());
        DailyForecastResponse response = dailyDemandForecastService.predictDailyDemand(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve daily demand model metadata, evaluation metrics, and baseline comparisons.
     */
    @GetMapping("/metadata")
    public ResponseEntity<Map<String, Object>> getModelMetadata() {
        Map<String, Object> metadata = dailyDemandForecastService.getDailyModelMetadata();
        return ResponseEntity.ok(metadata);
    }
}
