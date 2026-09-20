package com.stockup.backend.dto.forecast;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response payload containing daily demand predictions.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyForecastResponse {
    private String medicine;
    private Boolean hasHistoricalData;
    private String message;
    private String category;
    private Integer forecastHorizonDays;
    private String latestHistoricalDate;
    private Double totalPredictedUnits;
    private Double averageDailyDemand;
    private String model;
    private String modelVersion;
    private String modelType;
    private Map<String, Object> metrics;
    private List<DailyForecastPointDTO> forecast;
}
