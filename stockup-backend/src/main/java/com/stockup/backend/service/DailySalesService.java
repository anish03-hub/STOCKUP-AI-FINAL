package com.stockup.backend.service;

import com.stockup.backend.dto.sales.*;

import java.time.LocalDate;
import java.util.List;

public interface DailySalesService {

    SalesSummaryDTO getSalesSummary(LocalDate startDate, LocalDate endDate, String medicine, String country, String region, String category);

    List<SalesTrendDTO> getSalesTrends(LocalDate startDate, LocalDate endDate, String interval, String medicine, String country, String region, String category);

    List<TopMedicineDTO> getTopMedicines(LocalDate startDate, LocalDate endDate, String country, String region, String category, int limit);

    List<RegionalSalesDTO> getSalesByCountry(LocalDate startDate, LocalDate endDate, String medicine, String region, String category);

    List<RegionalSalesDTO> getSalesByRegion(LocalDate startDate, LocalDate endDate, String medicine, String country, String category);

    List<CategorySalesDTO> getSalesByCategory(LocalDate startDate, LocalDate endDate, String medicine, String country, String region);

    List<AgeGroupSalesDTO> getSalesByAgeGroup(LocalDate startDate, LocalDate endDate, String medicine, String country, String region, String category);

    List<CovidAnalysisDTO> getCovidComparison(LocalDate startDate, LocalDate endDate, String medicine, String country);

    List<StockTrendDTO> getStockTrends(LocalDate startDate, LocalDate endDate, String medicine, String country);

    SalesFilterOptionsDTO getFilterOptions();
}
