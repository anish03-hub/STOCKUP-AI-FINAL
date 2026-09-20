package com.stockup.backend.service;

import com.stockup.backend.dto.currency.ExchangeRatesResponseDTO;

import java.util.Map;

public interface ExchangeRateService {
    String BASE_CURRENCY = "USD";

    ExchangeRatesResponseDTO getLatestRates(String base);

    Double getExchangeRate(String base, String target);

    Map<String, Double> getAllRates();
}
