package com.stockup.backend.controller;

import com.stockup.backend.dto.DashboardSummaryDTO;
import com.stockup.backend.service.InventoryHealthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class InventoryHealthController {

    private final InventoryHealthService inventoryHealthService;

    @Autowired
    public InventoryHealthController(InventoryHealthService inventoryHealthService) {
        this.inventoryHealthService = inventoryHealthService;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getSummary() {
        DashboardSummaryDTO summary = inventoryHealthService.getDashboardSummary();
        return new ResponseEntity<>(summary, HttpStatus.OK);
    }
}
