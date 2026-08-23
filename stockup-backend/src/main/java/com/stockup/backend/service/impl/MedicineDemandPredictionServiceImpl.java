package com.stockup.backend.service.impl;

import com.stockup.backend.dto.MedicineDemandFastApiRequest;
import com.stockup.backend.dto.MedicineDemandFastApiResponse;
import com.stockup.backend.dto.MedicineDemandPredictionRequest;
import com.stockup.backend.dto.MedicineDemandPredictionResponse;
import com.stockup.backend.exception.InvalidMedicineProductCodeException;
import com.stockup.backend.exception.MedicineDemandPredictionException;
import com.stockup.backend.service.MedicineDemandPredictionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Calls the Python FastAPI medicine demand model endpoint.
 */
@Service
public class MedicineDemandPredictionServiceImpl implements MedicineDemandPredictionService {

    private static final Logger logger = LoggerFactory.getLogger(MedicineDemandPredictionServiceImpl.class);
    private static final List<String> SUPPORTED_PRODUCT_CODES = List.of(
            "M01AB", "M01AE", "N02BA", "N02BE", "N05B", "N05C", "R03", "R06"
    );
    private static final Set<String> SUPPORTED_PRODUCT_CODE_SET = Set.copyOf(SUPPORTED_PRODUCT_CODES);
    private static final String MEDICINE_DEMAND_ENDPOINT = "/medicine-demand/predict";

    @Value("${ml.api.url}")
    private String mlApiUrl;

    private final RestTemplate restTemplate;

    public MedicineDemandPredictionServiceImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public MedicineDemandPredictionResponse predictMedicineDemand(MedicineDemandPredictionRequest request) {
        String productCode = validateAndNormalizeProductCode(request);
        String url = mlApiUrl + MEDICINE_DEMAND_ENDPOINT;

        try {
            ResponseEntity<MedicineDemandFastApiResponse> responseEntity = restTemplate.postForEntity(
                    url,
                    new HttpEntity<>(new MedicineDemandFastApiRequest(productCode), createHeaders()),
                    MedicineDemandFastApiResponse.class
            );

            MedicineDemandFastApiResponse fastApiResponse = responseEntity.getBody();
            if (!responseEntity.getStatusCode().is2xxSuccessful() || fastApiResponse == null) {
                throw new MedicineDemandPredictionException(
                        HttpStatus.BAD_GATEWAY,
                        "Medicine demand service returned an empty or unsuccessful response"
                );
            }

            return toResponse(fastApiResponse);
        } catch (HttpStatusCodeException e) {
            logger.warn("Medicine demand FastAPI returned HTTP error: status={}, body={}",
                    e.getStatusCode(), e.getResponseBodyAsString());

            if (e.getStatusCode().is4xxClientError()) {
                throw new MedicineDemandPredictionException(
                        HttpStatus.BAD_REQUEST,
                        "Medicine demand service rejected the request for product code " + productCode,
                        e
                );
            }

            throw new MedicineDemandPredictionException(
                    HttpStatus.BAD_GATEWAY,
                    "Medicine demand service returned an error",
                    e
            );
        } catch (ResourceAccessException e) {
            logger.warn("Medicine demand FastAPI is unavailable or timed out", e);
            throw new MedicineDemandPredictionException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Medicine demand service is unavailable or timed out",
                    e
            );
        } catch (RestClientException e) {
            logger.warn("Medicine demand FastAPI returned an unexpected response", e);
            throw new MedicineDemandPredictionException(
                    HttpStatus.BAD_GATEWAY,
                    "Medicine demand service returned an unexpected response",
                    e
            );
        }
    }

    private String validateAndNormalizeProductCode(MedicineDemandPredictionRequest request) {
        String productCode = request == null ? null : request.getProductCode();
        if (productCode == null || productCode.trim().isEmpty()) {
            throw new InvalidMedicineProductCodeException("Product code is required");
        }

        String normalizedProductCode = productCode.trim().toUpperCase(Locale.ROOT);
        if (!SUPPORTED_PRODUCT_CODE_SET.contains(normalizedProductCode)) {
            throw new InvalidMedicineProductCodeException(
                    "Unsupported product code: " + productCode + ". Supported codes are: "
                            + String.join(", ", SUPPORTED_PRODUCT_CODES)
            );
        }

        return normalizedProductCode;
    }

    private MedicineDemandPredictionResponse toResponse(MedicineDemandFastApiResponse fastApiResponse) {
        if (fastApiResponse.getProductCode() == null
                || fastApiResponse.getLatestTimestamp() == null
                || fastApiResponse.getLatestObservedDemand() == null
                || fastApiResponse.getPredictedNextHourDemand() == null) {
            throw new MedicineDemandPredictionException(
                    HttpStatus.BAD_GATEWAY,
                    "Medicine demand service returned an unexpected response"
            );
        }

        return new MedicineDemandPredictionResponse(
                fastApiResponse.getProductCode(),
                fastApiResponse.getLatestTimestamp(),
                fastApiResponse.getLatestObservedDemand(),
                fastApiResponse.getPredictedNextHourDemand()
        );
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
