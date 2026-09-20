package com.stockup.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Explainable-AI proxy: forwards explanation requests from the frontend to the
 * Python ML service's /explain endpoints, keeping the frontend → backend → ML
 * flow consistent with the rest of the prediction pipeline.
 */
@Service
public class ExplainabilityService {

    private static final Logger logger = LoggerFactory.getLogger(ExplainabilityService.class);

    @Value("${ml.api.url}")
    private String mlApiUrl;

    private final RestTemplate restTemplate;

    public ExplainabilityService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /** Global feature importance for the demand model. */
    public Map<String, Object> explainGlobal() {
        String url = mlApiUrl + "/explain/global";
        ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                url, HttpMethod.GET, null, new ParameterizedTypeReference<Map<String, Object>>() {});
        logger.info("Explainability (global) status: {}", resp.getStatusCode());
        return resp.getBody();
    }

    /** Local explanation for a single prediction. */
    public Map<String, Object> explainPrediction(Map<String, Object> features) {
        String url = mlApiUrl + "/explain";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                url, HttpMethod.POST, new HttpEntity<>(features, headers),
                new ParameterizedTypeReference<Map<String, Object>>() {});
        logger.info("Explainability (local) status: {}", resp.getStatusCode());
        return resp.getBody();
    }
}
