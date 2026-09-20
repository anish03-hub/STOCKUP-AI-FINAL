package com.stockup.backend.service.impl;

import com.stockup.backend.dto.forecast.DailyForecastPointDTO;
import com.stockup.backend.dto.forecast.DailyForecastRequest;
import com.stockup.backend.dto.forecast.DailyForecastResponse;
import com.stockup.backend.model.Forecast;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.DailySaleRepository;
import com.stockup.backend.repository.ForecastRepository;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.service.DailyDemandForecastService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
public class DailyDemandForecastServiceImpl implements DailyDemandForecastService {

    private final RestTemplate restTemplate;
    private final CurrentUserService currentUserService;
    private final DailySaleRepository dailySaleRepository;
    private final ItemRepository itemRepository;
    private final ForecastRepository forecastRepository;

    @Value("${ml.api.url:http://localhost:8001}")
    private String mlApiUrl;

    public DailyDemandForecastServiceImpl(
            RestTemplate restTemplate,
            CurrentUserService currentUserService,
            DailySaleRepository dailySaleRepository,
            ItemRepository itemRepository,
            ForecastRepository forecastRepository) {
        this.restTemplate = restTemplate;
        this.currentUserService = currentUserService;
        this.dailySaleRepository = dailySaleRepository;
        this.itemRepository = itemRepository;
        this.forecastRepository = forecastRepository;
    }

    @Override
    public DailyForecastResponse predictDailyDemand(DailyForecastRequest request) {
        String businessId = currentUserService.getCurrentUserBusinessId();
        String medicine = request.getMedicine().trim();
        int horizonDays = request.getForecastDays() != null ? request.getForecastDays() : 7;

        log.info("Generating daily demand forecast for tenant '{}', medicine '{}', horizon={} days",
                businessId, medicine, horizonDays);

        // Multi-Tenant Isolation Check: Verify company has sales data
        if (businessId != null && !businessId.isBlank()) {
            long companySalesCount = dailySaleRepository.countByBusinessId(businessId);
            if (companySalesCount == 0) {
                log.info("Tenant '{}' has 0 historical sales records in daily_sales. Returning clean zero state.", businessId);
                return DailyForecastResponse.builder()
                        .medicine(medicine)
                        .hasHistoricalData(false)
                        .message("No historical sales data available for your company on medicine '" + medicine + "'. Please upload or seed your company's sales history to activate multi-day daily forecasting.")
                        .forecastHorizonDays(horizonDays)
                        .totalPredictedUnits(0.0)
                        .averageDailyDemand(0.0)
                        .model("DailyDemandForecastingModel")
                        .modelVersion("1.0")
                        .forecast(Collections.emptyList())
                        .build();
            }
        }

        // Call FastAPI ML Service: POST /daily-demand/predict
        String endpoint = mlApiUrl + "/daily-demand/predict";
        Map<String, Object> payload = new HashMap<>();
        payload.put("medicine", medicine);
        payload.put("forecast_days", horizonDays);
        if (request.getCountry() != null && !request.getCountry().isBlank()) {
            payload.put("country", request.getCountry().trim());
        }
        if (businessId != null && !businessId.isBlank()) {
            payload.put("business_id", businessId);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<DailyForecastResponse> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    httpEntity,
                    DailyForecastResponse.class
            );

            DailyForecastResponse forecastResponse = response.getBody();
            if (forecastResponse != null && forecastResponse.getForecast() != null && !forecastResponse.getForecast().isEmpty()) {
                // Asynchronously or safely persist forecast points into forecasts table
                persistForecastHistory(businessId, medicine, forecastResponse);
            }
            return forecastResponse;

        } catch (Exception e) {
            log.error("Failed to generate daily demand forecast from ML API: {}", e.getMessage(), e);
            throw new RuntimeException("ML daily demand forecasting failed: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> getDailyModelMetadata() {
        String endpoint = mlApiUrl + "/daily-demand/metadata";
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch daily demand model metadata: {}", e.getMessage());
            return Map.of("error", "Metadata service unavailable: " + e.getMessage());
        }
    }

    private void persistForecastHistory(String businessId, String medicine, DailyForecastResponse response) {
        try {
            // Find if there is an item in the live inventory catalog matching this medicine
            Optional<Item> itemOpt = Optional.empty();
            if (businessId != null && !businessId.isBlank()) {
                List<Item> items = itemRepository.findByBusinessId(businessId);
                itemOpt = items.stream()
                        .filter(i -> i.getName() != null && i.getName().toLowerCase().contains(medicine.toLowerCase()))
                        .findFirst();
            }

            for (DailyForecastPointDTO point : response.getForecast()) {
                Forecast f = new Forecast();
                f.setBusinessId(businessId);
                f.setProductName(response.getMedicine());
                if (itemOpt.isPresent()) {
                    Item item = itemOpt.get();
                    f.setItem(item);
                    f.setProductCode(item.getCode());
                } else {
                    f.setProductCode(medicine.toUpperCase().replaceAll("\\s+", "_"));
                }
                f.setForecastDate(point.getDate());
                f.setPredictedDemand(point.getPredictedDemand());
                f.setModel(response.getModel() != null ? response.getModel() + " v" + response.getModelVersion() : "DailyDemand v1.0");
                f.setConfidence(point.getLowerBound() != null && point.getUpperBound() != null
                        ? (point.getUpperBound() - point.getLowerBound()) : null);
                forecastRepository.save(f);
            }
            log.info("Persisted {} daily forecast points for medicine '{}' (tenant '{}')",
                    response.getForecast().size(), medicine, businessId);
        } catch (Exception e) {
            log.warn("Could not persist daily forecast history: {}", e.getMessage());
        }
    }
}
