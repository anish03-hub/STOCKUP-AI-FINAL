package com.stockup.backend.controller;

import com.stockup.backend.dto.LeadTimePredictionResponse;
import com.stockup.backend.service.LeadTimePredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for the Lead Time Prediction Module.
 */
@RestController
@RequestMapping("/api/leadtime")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class LeadTimeController {

    private final LeadTimePredictionService leadTimeService;

    public LeadTimeController(LeadTimePredictionService leadTimeService) {
        this.leadTimeService = leadTimeService;
    }

    /**
     * Predict lead time for a supplier.
     * Body: { "supplierId": "...", "supplierName": "...", "serviceLevel": 0.95 }
     * Either supplierId or supplierName is required.
     */
    @PostMapping("/predict")
    public ResponseEntity<?> predict(@RequestBody Map<String, Object> body) {
        String supplierId = body.get("supplierId") != null ? String.valueOf(body.get("supplierId")) : null;
        String supplierName = body.get("supplierName") != null ? String.valueOf(body.get("supplierName")) : null;
        double serviceLevel = 0.95;
        if (body.get("serviceLevel") != null) {
            try {
                serviceLevel = Double.parseDouble(String.valueOf(body.get("serviceLevel")));
            } catch (NumberFormatException ignored) {
                // keep default
            }
        }
        try {
            LeadTimePredictionResponse resp = leadTimeService.predict(supplierId, supplierName, serviceLevel);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
