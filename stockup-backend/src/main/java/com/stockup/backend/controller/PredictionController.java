package com.stockup.backend.controller;

import com.stockup.backend.dto.MedicineDemandPredictionRequest;
import com.stockup.backend.dto.MedicineDemandPredictionResponse;
import com.stockup.backend.dto.PredictionRequest;
import com.stockup.backend.dto.PredictionResponse;
import com.stockup.backend.service.MedicineDemandPredictionService;
import com.stockup.backend.service.PredictionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for demand prediction endpoints.
 */
@RestController
@RequestMapping("/api/predictions")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PredictionController {

    private final PredictionService predictionService;
    private final MedicineDemandPredictionService medicineDemandPredictionService;

    @Autowired
    public PredictionController(PredictionService predictionService,
                                MedicineDemandPredictionService medicineDemandPredictionService) {
        this.predictionService = predictionService;
        this.medicineDemandPredictionService = medicineDemandPredictionService;
    }

    /**
     * Predict demand for product/department based on input features.
     * 
     * @param request Prediction request containing all required features
     * @return ResponseEntity with prediction response
     */
    @PostMapping("/demand")
    public ResponseEntity<PredictionResponse> predictDemand(
            @Valid @RequestBody PredictionRequest request) {
        
        PredictionResponse response = predictionService.predictDemand(request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /**
     * Predict next-hour medicine demand for a supported product code.
     *
     * @param request Medicine demand request containing a product code
     * @return ResponseEntity with medicine demand prediction response
     */
    @PostMapping("/medicine-demand")
    public ResponseEntity<MedicineDemandPredictionResponse> predictMedicineDemand(
            @Valid @RequestBody MedicineDemandPredictionRequest request) {

        MedicineDemandPredictionResponse response =
                medicineDemandPredictionService.predictMedicineDemand(request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /**
     * Check if the prediction service is available.
     * 
     * @return ResponseEntity with service status
     */
    @GetMapping("/health")
    public ResponseEntity<String> predictionHealth() {
        try {
            // Try to make a simple prediction to check if service works
            PredictionRequest testRequest = createTestRequest();
            PredictionResponse response = predictionService.predictDemand(testRequest);
            
            return ResponseEntity.ok("Prediction service is healthy. Model: " + response.getModel());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Prediction service is unavailable: " + e.getMessage());
        }
    }

    /**
     * Create a test request for health checking.
     * 
     * @return Sample prediction request
     */
    private PredictionRequest createTestRequest() {
        PredictionRequest request = new PredictionRequest();
        request.setStore(1);
        request.setDept(1);
        request.setIsHoliday(0);
        request.setTemperature(65.0);
        request.setFuelPrice(3.5);
        request.setMarkDown1(0.0);
        request.setMarkDown2(0.0);
        request.setMarkDown3(0.0);
        request.setMarkDown4(0.0);
        request.setMarkDown5(0.0);
        request.setCpi(200.0);
        request.setUnemployment(5.0);
        request.setSize(50000.0);
        request.setYear(2023);
        request.setMonth(1);
        request.setWeek(1);
        request.setDay(1);
        request.setQuarter(1);
        request.setTypeB(0);
        request.setTypeC(0);
        return request;
    }
}
