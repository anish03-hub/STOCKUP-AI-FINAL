package com.stockup.backend.controller;

import com.stockup.backend.dto.ExpiryAlertSummary;
import com.stockup.backend.service.ExpiryAlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ExpiryAlertController {

    private final ExpiryAlertService expiryAlertService;

    @Autowired
    public ExpiryAlertController(ExpiryAlertService expiryAlertService) {
        this.expiryAlertService = expiryAlertService;
    }

    @GetMapping("/expiry-alerts")
    public ResponseEntity<ExpiryAlertSummary> getExpiryAlerts() {
        ExpiryAlertSummary summary = expiryAlertService.getExpiryAlerts();
        return new ResponseEntity<>(summary, HttpStatus.OK);
    }
}
