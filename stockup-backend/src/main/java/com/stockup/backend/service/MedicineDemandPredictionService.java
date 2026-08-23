package com.stockup.backend.service;

import com.stockup.backend.dto.MedicineDemandPredictionRequest;
import com.stockup.backend.dto.MedicineDemandPredictionResponse;

/**
 * Service interface for medicine hourly demand prediction operations.
 */
public interface MedicineDemandPredictionService {

    MedicineDemandPredictionResponse predictMedicineDemand(MedicineDemandPredictionRequest request);
}
