package com.stockup.backend.service;

import com.stockup.backend.dto.ForecastEvaluationDTO;

public interface ForecastEvaluationService {

    /**
     * Evaluates ML forecast accuracy comparing predicted demand against actual consumption.
     * Computes MAPE, RMSE, MAE, and time-series comparison points.
     *
     * @param productCode NDC or product code (optional, evaluates global or specified product)
     * @return ForecastEvaluationDTO with accuracy metrics and evaluation points
     */
    ForecastEvaluationDTO evaluateForecasts(String productCode);
}
