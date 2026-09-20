package com.stockup.backend.service;

import com.stockup.backend.dto.forecast.DailyForecastRequest;
import com.stockup.backend.dto.forecast.DailyForecastResponse;

import java.util.Map;

/**
 * Service interface for daily medicine demand forecasting.
 */
public interface DailyDemandForecastService {

    /**
     * Generate daily demand predictions for a medicine over a 7, 14, or 30-day horizon.
     *
     * @param request Daily forecast request parameters
     * @return DailyForecastResponse with predicted points and model metrics
     */
    DailyForecastResponse predictDailyDemand(DailyForecastRequest request);

    /**
     * Retrieve trained model metadata, baseline comparisons, and evaluation metrics.
     *
     * @return Map of model evaluation and metadata properties
     */
    Map<String, Object> getDailyModelMetadata();
}
