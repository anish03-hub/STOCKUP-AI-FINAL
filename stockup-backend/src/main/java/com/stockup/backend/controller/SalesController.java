package com.stockup.backend.controller;

import com.stockup.backend.dto.sales.*;
import com.stockup.backend.service.DailySalesService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller exposing historical sales intelligence and analytics endpoints.
 * All queries are strictly company-scoped via authenticated JWT credentials.
 */
@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SalesController {

    private final DailySalesService dailySalesService;

    @GetMapping("/summary")
    public ResponseEntity<SalesSummaryDTO> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String medicine,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(dailySalesService.getSalesSummary(startDate, endDate, medicine, country, region, category));
    }

    @GetMapping("/trends")
    public ResponseEntity<List<SalesTrendDTO>> getTrends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "monthly") String interval,
            @RequestParam(required = false) String medicine,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(dailySalesService.getSalesTrends(startDate, endDate, interval, medicine, country, region, category));
    }

    @GetMapping("/top-medicines")
    public ResponseEntity<List<TopMedicineDTO>> getTopMedicines(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(dailySalesService.getTopMedicines(startDate, endDate, country, region, category, limit));
    }

    @GetMapping("/countries")
    public ResponseEntity<List<RegionalSalesDTO>> getSalesByCountry(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String medicine,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(dailySalesService.getSalesByCountry(startDate, endDate, medicine, region, category));
    }

    @GetMapping("/regions")
    public ResponseEntity<List<RegionalSalesDTO>> getSalesByRegion(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String medicine,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(dailySalesService.getSalesByRegion(startDate, endDate, medicine, country, category));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategorySalesDTO>> getSalesByCategory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String medicine,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String region
    ) {
        return ResponseEntity.ok(dailySalesService.getSalesByCategory(startDate, endDate, medicine, country, region));
    }

    @GetMapping("/age-groups")
    public ResponseEntity<List<AgeGroupSalesDTO>> getSalesByAgeGroup(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String medicine,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(dailySalesService.getSalesByAgeGroup(startDate, endDate, medicine, country, region, category));
    }

    @GetMapping("/covid-analysis")
    public ResponseEntity<List<CovidAnalysisDTO>> getCovidAnalysis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String medicine,
            @RequestParam(required = false) String country
    ) {
        return ResponseEntity.ok(dailySalesService.getCovidComparison(startDate, endDate, medicine, country));
    }

    @GetMapping("/stock-trends")
    public ResponseEntity<List<StockTrendDTO>> getStockTrends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String medicine,
            @RequestParam(required = false) String country
    ) {
        return ResponseEntity.ok(dailySalesService.getStockTrends(startDate, endDate, medicine, country));
    }

    @GetMapping("/filters")
    public ResponseEntity<SalesFilterOptionsDTO> getFilterOptions() {
        return ResponseEntity.ok(dailySalesService.getFilterOptions());
    }
}
