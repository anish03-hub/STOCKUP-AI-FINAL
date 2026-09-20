package com.stockup.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockup.backend.dto.currency.ExchangeRatesResponseDTO;
import com.stockup.backend.service.ExchangeRateService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class ExchangeRateServiceImpl implements ExchangeRateService {

    private static final long CACHE_DURATION_MS = 3600_000L; // 1 hour
    private static final String API_URL = "https://open.er-api.com/v6/latest/USD";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z")
            .withZone(ZoneId.systemDefault());

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    private final Map<String, Double> cachedRates = new ConcurrentHashMap<>();
    private volatile long lastFetchTimestamp = 0L;
    private volatile String activeProvider = "Open Exchange Rates (er-api.com)";

    public ExchangeRateServiceImpl() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(4))
                .build();
        this.objectMapper = new ObjectMapper();
        initDefaultFallbackRates();
    }

    private void initDefaultFallbackRates() {
        // High-precision fallback rates if network/external API is unreachable
        Map<String, Double> fallback = new HashMap<>();
        fallback.put("USD", 1.0);
        fallback.put("INR", 95.8178);
        fallback.put("EUR", 0.9214);
        fallback.put("GBP", 0.7892);
        fallback.put("CAD", 1.3782);
        fallback.put("AUD", 1.5420);
        fallback.put("JPY", 154.25);
        fallback.put("CNY", 7.2345);
        fallback.put("SGD", 1.3450);
        fallback.put("AED", 3.6725);
        cachedRates.putAll(fallback);
        lastFetchTimestamp = System.currentTimeMillis();
    }

    @Override
    public synchronized ExchangeRatesResponseDTO getLatestRates(String base) {
        String baseCurrency = (base != null && !base.isBlank()) ? base.trim().toUpperCase() : BASE_CURRENCY;
        long now = System.currentTimeMillis();
        boolean isExpired = (now - lastFetchTimestamp) > CACHE_DURATION_MS;

        if (isExpired || cachedRates.size() <= 1) {
            fetchLiveRates();
        }

        Map<String, Double> ratesMap = new HashMap<>(cachedRates);

        // If requested base is not USD, re-normalize rates
        if (!BASE_CURRENCY.equalsIgnoreCase(baseCurrency) && ratesMap.containsKey(baseCurrency)) {
            double baseToUsd = ratesMap.get(baseCurrency);
            if (baseToUsd > 0) {
                Map<String, Double> normalized = new HashMap<>();
                for (Map.Entry<String, Double> entry : ratesMap.entrySet()) {
                    normalized.put(entry.getKey(), entry.getValue() / baseToUsd);
                }
                ratesMap = normalized;
            }
        }

        return ExchangeRatesResponseDTO.builder()
                .base(baseCurrency)
                .rates(Collections.unmodifiableMap(ratesMap))
                .lastUpdated(lastFetchTimestamp)
                .lastUpdatedFormatted(FORMATTER.format(Instant.ofEpochMilli(lastFetchTimestamp)))
                .cached(!isExpired)
                .provider(activeProvider)
                .build();
    }

    @Override
    public Double getExchangeRate(String base, String target) {
        if (target == null || target.isBlank()) {
            return 1.0;
        }
        String baseCurr = (base != null && !base.isBlank()) ? base.trim().toUpperCase() : BASE_CURRENCY;
        String targetCurr = target.trim().toUpperCase();

        if (baseCurr.equalsIgnoreCase(targetCurr)) {
            return 1.0;
        }

        long now = System.currentTimeMillis();
        if ((now - lastFetchTimestamp) > CACHE_DURATION_MS || !cachedRates.containsKey(targetCurr)) {
            fetchLiveRates();
        }

        Double baseRate = cachedRates.getOrDefault(baseCurr, 1.0);
        Double targetRate = cachedRates.get(targetCurr);

        if (targetRate == null) {
            log.warn("Target currency rate not found for '{}', returning 1.0", targetCurr);
            return 1.0;
        }

        if (baseRate == null || baseRate <= 0) {
            baseRate = 1.0;
        }

        return targetRate / baseRate;
    }

    @Override
    public Map<String, Double> getAllRates() {
        return Collections.unmodifiableMap(new HashMap<>(cachedRates));
    }

    private void fetchLiveRates() {
        try {
            log.info("Fetching fresh exchange rates from: {}", API_URL);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL))
                    .timeout(Duration.ofSeconds(5))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 && response.body() != null) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode ratesNode = root.get("rates");
                if (ratesNode != null && ratesNode.isObject()) {
                    Map<String, Double> newRates = new HashMap<>();
                    for (Map.Entry<String, JsonNode> field : ratesNode.properties()) {
                        if (field.getValue().isNumber()) {
                            newRates.put(field.getKey().toUpperCase(), field.getValue().asDouble());
                        }
                    }

                    if (!newRates.isEmpty()) {
                        newRates.put("USD", 1.0); // Guarantee base USD is 1.0
                        cachedRates.putAll(newRates);
                        lastFetchTimestamp = System.currentTimeMillis();
                        activeProvider = "Open Exchange Rates (Live)";
                        log.info("Successfully fetched and cached {} currency exchange rates.", newRates.size());
                        return;
                    }
                }
            }
            log.warn("Non-200 or empty response from exchange rate API (status: {}). Retaining cached rates.", response.statusCode());
        } catch (Exception e) {
            log.warn("Failed to fetch live exchange rates from {}: {}. Falling back to cached rates.", API_URL, e.getMessage());
            // Retain existing cached rates or fallback rates
            if (cachedRates.isEmpty()) {
                initDefaultFallbackRates();
            }
        }
    }
}
