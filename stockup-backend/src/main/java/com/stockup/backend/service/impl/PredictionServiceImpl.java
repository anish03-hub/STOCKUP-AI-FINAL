package com.stockup.backend.service.impl;

import com.stockup.backend.dto.PredictionRequest;
import com.stockup.backend.dto.PredictionResponse;
import com.stockup.backend.service.PredictionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.client.*;

/**
 * Implementation of PredictionService that calls the Python ML API.
 */
@Service
public class PredictionServiceImpl implements PredictionService {

    private static final Logger logger = LoggerFactory.getLogger(PredictionServiceImpl.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    // Configuration for Python ML API
    @Value("${ml.api.url}")
    private String mlApiUrl;

    private static final String PREDICT_ENDPOINT = "/predict";
    private static final String HEALTH_ENDPOINT = "/health";

    private final RestTemplate restTemplate;

    public PredictionServiceImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public PredictionResponse predictDemand(PredictionRequest request) {
        try {
        System.out.println("PREDICTION SERVICE CALLED WITH REQUEST: " + request);
            // Log the request for debugging
            logger.info("Sending prediction request to Python ML API: {}", 
                objectMapper.writeValueAsString(request));

            // Check if Python ML API is healthy
            if (!isPythonApiHealthy()) {
                throw new RuntimeException("Python ML API is not available");
            }

            // Prepare the request to Python ML API
            String url = mlApiUrl + PREDICT_ENDPOINT;
            
            // Send POST request to Python ML API
            ResponseEntity<PredictionResponse> responseEntity = restTemplate.postForEntity(
                url,
                new HttpEntity<>(request, createHeaders()),
                PredictionResponse.class
            );

            // Log the response for debugging
            logger.info("Received response from Python ML API: Status={}, Body={}", 
                responseEntity.getStatusCode(), 
                responseEntity.getBody() != null ? objectMapper.writeValueAsString(responseEntity.getBody()) : "null");

            // Return the response from Python ML API
            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                return responseEntity.getBody();
            } else {
                throw new RuntimeException("Failed to get prediction from Python ML API: " + 
                    responseEntity.getStatusCode());
            }
        } catch (ResourceAccessException e) {
            logger.error("Unable to connect to Python ML API", e);
            throw new RuntimeException("Unable to connect to Python ML API: " + e.getMessage(), e);
        } catch (HttpStatusCodeException e) {
            logger.error("Python ML API returned error", e);
            throw new RuntimeException("Python ML API returned error: " + 
                e.getStatusCode() + " - " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            logger.error("Error predicting demand", e);
            throw new RuntimeException("Error predicting demand: " + e.getMessage(), e);
        }
    }

    /**
     * Check if the Python ML API is healthy.
     * 
     * @return true if API is healthy, false otherwise
     */
    private boolean isPythonApiHealthy() {
        try {
            String url = mlApiUrl + HEALTH_ENDPOINT;
            @NonNull HttpMethod method = HttpMethod.GET;
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                method,
                new HttpEntity<>(createHeaders()),
                String.class
            );
            
            logger.info("Python ML API health check: Status={}, Body={}", 
                response.getStatusCode(), response.getBody());
            
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            logger.error("Error checking Python ML API health", e);
            return false;
        }
    }

    /**
     * Create HTTP headers for requests.
     * 
     * @return HttpHeaders with content type set to JSON
     */
    @NonNull
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
