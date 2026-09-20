package com.stockup.backend.service;

import com.stockup.backend.dto.sales.SalesSummaryDTO;
import com.stockup.backend.model.Business;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.repository.DailySaleRepository;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.service.impl.DailySalesServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

public class DailySalesServiceTest {

    private DailySaleRepository dailySaleRepository;
    private BusinessRepository businessRepository;
    private CurrentUserService currentUserService;
    private DailySalesServiceImpl dailySalesService;

    @BeforeEach
    public void setUp() {
        dailySaleRepository = Mockito.mock(DailySaleRepository.class);
        businessRepository = Mockito.mock(BusinessRepository.class);
        currentUserService = Mockito.mock(CurrentUserService.class);
        dailySalesService = new DailySalesServiceImpl(dailySaleRepository, businessRepository, currentUserService);
    }

    @Test
    public void testGetSalesSummary_WithAuthenticatedCompany() {
        String businessId = "test-business-id";
        when(currentUserService.getCurrentUserBusinessIdOptional()).thenReturn(Optional.of(businessId));

        Business business = new Business();
        business.setId(businessId);
        business.setBusinessName("Global Health Pharmacy");
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));

        Object[] summaryRow = new Object[]{
                150000L,       // totalUnitsSold
                7500000.0,     // totalRevenue
                50.0,          // averageUnitPrice
                3000L,         // totalTransactions
                10L,           // activeMedicines
                19L,           // countriesCovered
                6L,            // regionsCovered
                "2020-01-01",  // minDate
                "2025-12-31"   // maxDate
        };
        List<Object[]> rows = new java.util.ArrayList<>();
        rows.add(summaryRow);
        when(dailySaleRepository.getSalesSummary(eq(businessId), any(), any(), any(), any(), any(), any()))
                .thenReturn(rows);

        SalesSummaryDTO summary = dailySalesService.getSalesSummary(LocalDate.of(2020, 1, 1), LocalDate.of(2025, 12, 31), null, null, null, null);

        assertNotNull(summary);
        assertEquals("Global Health Pharmacy", summary.getBusinessName());
        assertEquals(150000L, summary.getTotalUnitsSold());
        assertEquals(7500000.0, summary.getTotalRevenue());
        assertEquals(50.0, summary.getAverageUnitPrice());
        assertEquals(10L, summary.getActiveMedicines());
        assertEquals(19L, summary.getCountriesCovered());
        assertEquals(6L, summary.getRegionsCovered());
    }

    @Test
    public void testGetSalesSummary_WithEmptySalesData() {
        String businessId = "empty-business-id";
        when(currentUserService.getCurrentUserBusinessIdOptional()).thenReturn(Optional.of(businessId));
        when(businessRepository.findById(businessId)).thenReturn(Optional.empty());
        when(dailySaleRepository.getSalesSummary(eq(businessId), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        SalesSummaryDTO summary = dailySalesService.getSalesSummary(null, null, null, null, null, null);

        assertNotNull(summary);
        assertEquals(0L, summary.getTotalUnitsSold());
        assertEquals(0.0, summary.getTotalRevenue());
    }

    @Test
    public void testGetSalesTrends_MonthlyAndDaily() {
        String businessId = "test-business-id";
        when(currentUserService.getCurrentUserBusinessIdOptional()).thenReturn(Optional.of(businessId));

        Object[] trendRow = new Object[]{"2024-01", 50000L, 250000.0, 5.0, 100L};
        List<Object[]> rows = new java.util.ArrayList<>();
        rows.add(trendRow);
        when(dailySaleRepository.getMonthlySalesTrend(eq(businessId), any(), any(), any(), any(), any(), any()))
                .thenReturn(rows);

        var trends = dailySalesService.getSalesTrends(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31), "monthly", "Paracetamol", "USA", "North America", "Antipyretic");
        assertNotNull(trends);
        assertEquals(1, trends.size());
        assertEquals("2024-01", trends.get(0).getPeriod());
        assertEquals(50000L, trends.get(0).getUnitsSold());
    }

    @Test
    public void testGetFilterOptions() {
        String businessId = "test-business-id";
        when(currentUserService.getCurrentUserBusinessIdOptional()).thenReturn(Optional.of(businessId));
        when(dailySaleRepository.findDistinctMedicinesByBusinessId(businessId)).thenReturn(List.of("Azithromycin", "Paracetamol"));
        when(dailySaleRepository.findDistinctCountriesByBusinessId(businessId)).thenReturn(List.of("Brazil", "USA"));
        when(dailySaleRepository.countByBusinessId(businessId)).thenReturn(177990L);

        var filterOpts = dailySalesService.getFilterOptions();
        assertNotNull(filterOpts);
        assertEquals(2, filterOpts.getMedicines().size());
        assertEquals(2, filterOpts.getCountries().size());
        assertEquals(177990L, filterOpts.getTotalRecords());
    }
}
