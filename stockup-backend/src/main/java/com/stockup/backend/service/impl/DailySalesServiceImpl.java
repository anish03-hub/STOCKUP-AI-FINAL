package com.stockup.backend.service.impl;

import com.stockup.backend.dto.sales.*;
import com.stockup.backend.model.Business;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.repository.DailySaleRepository;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.service.DailySalesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailySalesServiceImpl implements DailySalesService {

    private final DailySaleRepository dailySaleRepository;
    private final BusinessRepository businessRepository;
    private final CurrentUserService currentUserService;

    private String resolveCurrentBusinessId() {
        return currentUserService.getCurrentUserBusinessIdOptional().orElse(null);
    }

    private String resolveBusinessName(String businessId) {
        if (businessId == null) return "StockUp AI";
        return businessRepository.findById(businessId)
                .map(Business::getBusinessName)
                .orElse("StockUp Enterprise");
    }

    @Override
    public SalesSummaryDTO getSalesSummary(LocalDate startDate, LocalDate endDate, String medicine, String country, String region, String category) {
        String businessId = resolveCurrentBusinessId();
        if (businessId == null) {
            return SalesSummaryDTO.builder()
                    .businessName("StockUp AI")
                    .build();
        }

        String businessName = resolveBusinessName(businessId);
        List<Object[]> rows = dailySaleRepository.getSalesSummary(businessId, startDate, endDate, medicine, country, region, category);

        if (rows == null || rows.isEmpty() || rows.get(0) == null) {
            return SalesSummaryDTO.builder()
                    .businessName(businessName)
                    .startDate(startDate)
                    .endDate(endDate)
                    .build();
        }

        Object[] row = rows.get(0);
        long totalUnitsSold = toLong(row[0]);
        double totalRevenue = toDouble(row[1]);
        double averageUnitPrice = toDouble(row[2]);
        long totalTransactions = toLong(row[3]);
        long activeMedicines = toLong(row[4]);
        long countriesCovered = toLong(row[5]);
        long regionsCovered = toLong(row[6]);

        LocalDate actualStart = row[7] != null ? java.sql.Date.valueOf(row[7].toString()).toLocalDate() : startDate;
        LocalDate actualEnd = row[8] != null ? java.sql.Date.valueOf(row[8].toString()).toLocalDate() : endDate;

        return SalesSummaryDTO.builder()
                .businessName(businessName)
                .totalUnitsSold(totalUnitsSold)
                .totalRevenue(totalRevenue)
                .averageUnitPrice(averageUnitPrice)
                .totalTransactions(totalTransactions)
                .activeMedicines(activeMedicines)
                .countriesCovered(countriesCovered)
                .regionsCovered(regionsCovered)
                .startDate(actualStart)
                .endDate(actualEnd)
                .build();
    }

    @Override
    public List<SalesTrendDTO> getSalesTrends(LocalDate startDate, LocalDate endDate, String interval, String medicine, String country, String region, String category) {
        String businessId = resolveCurrentBusinessId();
        List<SalesTrendDTO> results = new ArrayList<>();
        if (businessId == null) return results;

        List<Object[]> rows;
        if ("daily".equalsIgnoreCase(interval)) {
            rows = dailySaleRepository.getDailySalesTrend(businessId, startDate, endDate, medicine, country, region, category, 180);
        } else {
            rows = dailySaleRepository.getMonthlySalesTrend(businessId, startDate, endDate, medicine, country, region, category);
        }

        if (rows != null) {
            for (Object[] row : rows) {
                results.add(SalesTrendDTO.builder()
                        .period(row[0] != null ? row[0].toString() : "")
                        .unitsSold(toLong(row[1]))
                        .revenue(toDouble(row[2]))
                        .averagePrice(toDouble(row[3]))
                        .transactionCount(toLong(row[4]))
                        .build());
            }
        }
        return results;
    }

    @Override
    public List<TopMedicineDTO> getTopMedicines(LocalDate startDate, LocalDate endDate, String country, String region, String category, int limit) {
        String businessId = resolveCurrentBusinessId();
        List<TopMedicineDTO> results = new ArrayList<>();
        if (businessId == null) return results;

        int safeLimit = (limit <= 0 || limit > 50) ? 10 : limit;
        List<Object[]> rows = dailySaleRepository.getTopMedicines(businessId, startDate, endDate, country, region, category, safeLimit);

        double totalMarketRevenue = 0.0;
        if (rows != null) {
            for (Object[] row : rows) {
                totalMarketRevenue += toDouble(row[3]);
            }
            for (Object[] row : rows) {
                double rev = toDouble(row[3]);
                double share = totalMarketRevenue > 0 ? (rev / totalMarketRevenue) * 100.0 : 0.0;
                results.add(TopMedicineDTO.builder()
                        .medicine(row[0] != null ? row[0].toString() : "Unknown")
                        .category(row[1] != null ? row[1].toString() : "General")
                        .unitsSold(toLong(row[2]))
                        .revenue(rev)
                        .averagePrice(toDouble(row[4]))
                        .marketSharePercent(Math.round(share * 10.0) / 10.0)
                        .build());
            }
        }
        return results;
    }

    @Override
    public List<RegionalSalesDTO> getSalesByCountry(LocalDate startDate, LocalDate endDate, String medicine, String region, String category) {
        String businessId = resolveCurrentBusinessId();
        List<RegionalSalesDTO> results = new ArrayList<>();
        if (businessId == null) return results;

        List<Object[]> rows = dailySaleRepository.getSalesByCountry(businessId, startDate, endDate, medicine, region, category);
        double totalRev = 0.0;
        if (rows != null) {
            for (Object[] row : rows) {
                totalRev += toDouble(row[3]);
            }
            for (Object[] row : rows) {
                double rev = toDouble(row[3]);
                double pct = totalRev > 0 ? (rev / totalRev) * 100.0 : 0.0;
                results.add(RegionalSalesDTO.builder()
                        .name(row[0] != null ? row[0].toString() : "Unknown")
                        .region(row[1] != null ? row[1].toString() : "")
                        .unitsSold(toLong(row[2]))
                        .revenue(rev)
                        .percentage(Math.round(pct * 10.0) / 10.0)
                        .build());
            }
        }
        return results;
    }

    @Override
    public List<RegionalSalesDTO> getSalesByRegion(LocalDate startDate, LocalDate endDate, String medicine, String country, String category) {
        String businessId = resolveCurrentBusinessId();
        List<RegionalSalesDTO> results = new ArrayList<>();
        if (businessId == null) return results;

        List<Object[]> rows = dailySaleRepository.getSalesByRegion(businessId, startDate, endDate, medicine, country, category);
        double totalRev = 0.0;
        if (rows != null) {
            for (Object[] row : rows) {
                totalRev += toDouble(row[2]);
            }
            for (Object[] row : rows) {
                double rev = toDouble(row[2]);
                double pct = totalRev > 0 ? (rev / totalRev) * 100.0 : 0.0;
                results.add(RegionalSalesDTO.builder()
                        .name(row[0] != null ? row[0].toString() : "Unknown")
                        .region(row[0] != null ? row[0].toString() : "")
                        .unitsSold(toLong(row[1]))
                        .revenue(rev)
                        .percentage(Math.round(pct * 10.0) / 10.0)
                        .build());
            }
        }
        return results;
    }

    @Override
    public List<CategorySalesDTO> getSalesByCategory(LocalDate startDate, LocalDate endDate, String medicine, String country, String region) {
        String businessId = resolveCurrentBusinessId();
        List<CategorySalesDTO> results = new ArrayList<>();
        if (businessId == null) return results;

        List<Object[]> rows = dailySaleRepository.getSalesByCategory(businessId, startDate, endDate, medicine, country, region);
        double totalRev = 0.0;
        if (rows != null) {
            for (Object[] row : rows) {
                totalRev += toDouble(row[2]);
            }
            for (Object[] row : rows) {
                double rev = toDouble(row[2]);
                double pct = totalRev > 0 ? (rev / totalRev) * 100.0 : 0.0;
                results.add(CategorySalesDTO.builder()
                        .category(row[0] != null ? row[0].toString() : "General")
                        .unitsSold(toLong(row[1]))
                        .revenue(rev)
                        .percentage(Math.round(pct * 10.0) / 10.0)
                        .build());
            }
        }
        return results;
    }

    @Override
    public List<AgeGroupSalesDTO> getSalesByAgeGroup(LocalDate startDate, LocalDate endDate, String medicine, String country, String region, String category) {
        String businessId = resolveCurrentBusinessId();
        List<AgeGroupSalesDTO> results = new ArrayList<>();
        if (businessId == null) return results;

        List<Object[]> rows = dailySaleRepository.getSalesByAgeGroup(businessId, startDate, endDate, medicine, country, region, category);
        double totalUnits = 0.0;
        if (rows != null) {
            for (Object[] row : rows) {
                totalUnits += toLong(row[1]);
            }
            for (Object[] row : rows) {
                long units = toLong(row[1]);
                double pct = totalUnits > 0 ? (units / totalUnits) * 100.0 : 0.0;
                results.add(AgeGroupSalesDTO.builder()
                        .ageGroup(row[0] != null ? row[0].toString() : "All Ages")
                        .unitsSold(units)
                        .revenue(toDouble(row[2]))
                        .percentage(Math.round(pct * 10.0) / 10.0)
                        .build());
            }
        }
        return results;
    }

    @Override
    public List<CovidAnalysisDTO> getCovidComparison(LocalDate startDate, LocalDate endDate, String medicine, String country) {
        String businessId = resolveCurrentBusinessId();
        List<CovidAnalysisDTO> results = new ArrayList<>();
        if (businessId == null) return results;

        List<Object[]> rows = dailySaleRepository.getCovidComparison(businessId, startDate, endDate, medicine, country);
        if (rows != null) {
            for (Object[] row : rows) {
                boolean flag = Boolean.TRUE.equals(row[0]) || "1".equals(String.valueOf(row[0])) || "true".equalsIgnoreCase(String.valueOf(row[0]));
                long units = toLong(row[1]);
                double rev = toDouble(row[2]);
                long txCount = toLong(row[3]);
                double avgPrice = toDouble(row[4]);
                long distinctDays = toLong(row[5]);
                double avgPerDay = distinctDays > 0 ? (double) units / distinctDays : 0.0;

                results.add(CovidAnalysisDTO.builder()
                        .period(flag ? "COVID Period (Flagged)" : "Non-COVID Baseline")
                        .covidFlag(flag)
                        .unitsSold(units)
                        .revenue(rev)
                        .avgUnitsPerDay(Math.round(avgPerDay * 10.0) / 10.0)
                        .transactionCount(txCount)
                        .averageUnitPrice(avgPrice)
                        .build());
            }
        }
        return results;
    }

    @Override
    public List<StockTrendDTO> getStockTrends(LocalDate startDate, LocalDate endDate, String medicine, String country) {
        String businessId = resolveCurrentBusinessId();
        List<StockTrendDTO> results = new ArrayList<>();
        if (businessId == null) return results;

        List<Object[]> rows = dailySaleRepository.getStockTrends(businessId, startDate, endDate, medicine, country);
        if (rows != null) {
            for (Object[] row : rows) {
                results.add(StockTrendDTO.builder()
                        .period(row[0] != null ? row[0].toString() : "")
                        .medicine(medicine != null ? medicine : "All Medicines")
                        .avgStockLevel(Math.round(toDouble(row[1]) * 10.0) / 10.0)
                        .unitsSold(toLong(row[2]))
                        .avgExpiryDaysRemaining(Math.round(toDouble(row[3]) * 10.0) / 10.0)
                        .build());
            }
        }
        return results;
    }

    @Override
    public SalesFilterOptionsDTO getFilterOptions() {
        String businessId = resolveCurrentBusinessId();
        if (businessId == null) {
            return SalesFilterOptionsDTO.builder().build();
        }

        List<String> medicines = dailySaleRepository.findDistinctMedicinesByBusinessId(businessId);
        List<String> countries = dailySaleRepository.findDistinctCountriesByBusinessId(businessId);
        List<String> regions = dailySaleRepository.findDistinctRegionsByBusinessId(businessId);
        List<String> categories = dailySaleRepository.findDistinctCategoriesByBusinessId(businessId);
        List<String> ageGroups = dailySaleRepository.findDistinctAgeGroupsByBusinessId(businessId);
        LocalDate minDate = dailySaleRepository.findMinDateByBusinessId(businessId);
        LocalDate maxDate = dailySaleRepository.findMaxDateByBusinessId(businessId);
        long totalRecords = dailySaleRepository.countByBusinessId(businessId);

        return SalesFilterOptionsDTO.builder()
                .medicines(medicines)
                .countries(countries)
                .regions(regions)
                .categories(categories)
                .ageGroups(ageGroups)
                .minDate(minDate)
                .maxDate(maxDate)
                .totalRecords(totalRecords)
                .build();
    }

    // ── Safe type conversion helpers ───────────────────────────────────────────
    private long toLong(Object obj) {
        if (obj == null) return 0L;
        if (obj instanceof Number num) return num.longValue();
        try {
            return Long.parseLong(obj.toString().trim());
        } catch (Exception e) {
            return 0L;
        }
    }

    private double toDouble(Object obj) {
        if (obj == null) return 0.0;
        if (obj instanceof Number num) return num.doubleValue();
        if (obj instanceof BigDecimal bd) return bd.doubleValue();
        try {
            return Double.parseDouble(obj.toString().trim());
        } catch (Exception e) {
            return 0.0;
        }
    }
}
