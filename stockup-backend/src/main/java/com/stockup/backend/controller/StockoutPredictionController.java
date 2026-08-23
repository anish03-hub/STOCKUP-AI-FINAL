package com.stockup.backend.controller;

import com.stockup.backend.dto.StockoutRequest;
import com.stockup.backend.dto.StockoutResponse;
import com.stockup.backend.service.StockoutPredictionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for stock-out prediction endpoints.
 * Calculates risk of stock depletion based on current quantity vs predicted demand.
 */
@RestController
@RequestMapping("/api/stockout")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class StockoutPredictionController {

    private final StockoutPredictionService stockoutService;

    @Autowired
    public StockoutPredictionController(StockoutPredictionService stockoutService) {
        this.stockoutService = stockoutService;
    }

    /**
     * Predict stock-out risk for a medicine/product.
     *
     * @param request StockoutRequest with medicineName, currentQuantity, predictedDemand
     * @return ResponseEntity with StockoutResponse containing risk analysis
     */
    @PostMapping("/predict")
    public ResponseEntity<StockoutResponse> predictStockout(
            @Valid @RequestBody StockoutRequest request) {

        StockoutResponse response = stockoutService.calculateStockoutRisk(request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
