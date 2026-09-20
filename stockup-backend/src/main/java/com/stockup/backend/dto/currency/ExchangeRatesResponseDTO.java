package com.stockup.backend.dto.currency;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeRatesResponseDTO {
    private String base;
    private Map<String, Double> rates;
    private long lastUpdated;
    private String lastUpdatedFormatted;
    private boolean cached;
    private String provider;
}
