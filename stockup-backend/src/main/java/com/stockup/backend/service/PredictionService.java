package com.stockup.backend.service;

import com.stockup.backend.dto.PredictionRequest;
import com.stockup.backend.dto.PredictionResponse;

/**
 * Service interface for demand prediction operations.
 */
public interface PredictionService {

    /**
     * Predict demand based on input features.
     * 
     * @param request Prediction request containing all required features
     * @return Prediction response with predicted demand value
     */
    PredictionResponse predictDemand(PredictionRequest request);
}
