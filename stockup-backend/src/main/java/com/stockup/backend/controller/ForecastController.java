package com.stockup.backend.controller;

import com.stockup.backend.model.Forecast;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ForecastRepository;
import com.stockup.backend.repository.ItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST controller for persisted demand forecasts (FORECAST table).
 * Lets the dashboard save and review historical forecasts.
 */
@RestController
@RequestMapping("/api/forecast")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ForecastController {

    private final ForecastRepository forecastRepository;
    private final ItemRepository itemRepository;

    public ForecastController(ForecastRepository forecastRepository, ItemRepository itemRepository) {
        this.forecastRepository = forecastRepository;
        this.itemRepository = itemRepository;
    }

    /** Recent forecast history (latest 50), or filtered by product code. */
    @GetMapping("/history")
    public ResponseEntity<List<Forecast>> history(@RequestParam(required = false) String productCode) {
        if (productCode != null && !productCode.isBlank()) {
            return ResponseEntity.ok(
                    forecastRepository.findByProductCodeIgnoreCaseOrderByCreatedAtDesc(productCode));
        }
        return ResponseEntity.ok(forecastRepository.findTop50ByOrderByCreatedAtDesc());
    }

    /** Persist a forecast result. Safely resolves Item by productCode. */
    @PostMapping("/save")
    public ResponseEntity<?> save(@RequestBody Forecast forecast) {
        if (forecast.getProductCode() == null || forecast.getProductCode().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Product code is required"));
        }

        Optional<Item> itemOpt = itemRepository.findByCodeIgnoreCase(forecast.getProductCode().trim());
        if (itemOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Item not found with product code: " + forecast.getProductCode()));
        }

        Item item = itemOpt.get();
        forecast.setId(null);
        forecast.setItem(item);
        if (forecast.getProductName() == null || forecast.getProductName().isBlank()) {
            forecast.setProductName(item.getName());
        }

        Forecast saved = forecastRepository.save(forecast);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }
}
