package com.stockup.backend.service;

import com.stockup.backend.dto.forecast.DailyForecastPointDTO;
import com.stockup.backend.dto.forecast.DailyForecastRequest;
import com.stockup.backend.dto.forecast.DailyForecastResponse;
import com.stockup.backend.repository.DailySaleRepository;
import com.stockup.backend.repository.ForecastRepository;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.service.impl.DailyDemandForecastServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DailyDemandForecastServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private DailySaleRepository dailySaleRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private ForecastRepository forecastRepository;

    @InjectMocks
    private DailyDemandForecastServiceImpl dailyDemandForecastService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(dailyDemandForecastService, "mlApiUrl", "http://localhost:8001");
    }

    @Test
    void testPredictDailyDemand_WhenCompanyHasNoSales_ReturnsEmptyState() {
        when(currentUserService.getCurrentUserBusinessId()).thenReturn("empty-company-id");
        when(dailySaleRepository.countByBusinessId("empty-company-id")).thenReturn(0L);

        DailyForecastRequest request = DailyForecastRequest.builder()
                .medicine("Paracetamol")
                .forecastDays(7)
                .build();

        DailyForecastResponse response = dailyDemandForecastService.predictDailyDemand(request);

        assertNotNull(response);
        assertEquals("Paracetamol", response.getMedicine());
        assertFalse(response.getHasHistoricalData());
        assertTrue(response.getMessage().contains("No historical sales data available"));
        assertTrue(response.getForecast().isEmpty());

        verifyNoInteractions(restTemplate);
    }

    @Test
    void testPredictDailyDemand_WhenCompanyHasSales_CallsMLService() {
        when(currentUserService.getCurrentUserBusinessId()).thenReturn("demo-company-id");
        when(dailySaleRepository.countByBusinessId("demo-company-id")).thenReturn(177990L);

        DailyForecastPointDTO point = DailyForecastPointDTO.builder()
                .date("2026-01-01")
                .predictedDemand(425.25)
                .lowerBound(400.0)
                .upperBound(450.0)
                .dayOfWeek("Thursday")
                .isWeekend(false)
                .build();

        DailyForecastResponse mockMLResponse = DailyForecastResponse.builder()
                .medicine("Paracetamol")
                .hasHistoricalData(true)
                .forecastHorizonDays(7)
                .totalPredictedUnits(2933.49)
                .averageDailyDemand(419.07)
                .model("DailyDemandForecastingModel")
                .modelVersion("1.0")
                .forecast(List.of(point))
                .build();

        when(restTemplate.exchange(
                eq("http://localhost:8001/daily-demand/predict"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(DailyForecastResponse.class)
        )).thenReturn(new ResponseEntity<>(mockMLResponse, HttpStatus.OK));

        when(itemRepository.findByBusinessId("demo-company-id")).thenReturn(Collections.emptyList());

        DailyForecastRequest request = DailyForecastRequest.builder()
                .medicine("Paracetamol")
                .forecastDays(7)
                .build();

        DailyForecastResponse response = dailyDemandForecastService.predictDailyDemand(request);

        assertNotNull(response);
        assertTrue(response.getHasHistoricalData());
        assertEquals("Paracetamol", response.getMedicine());
        assertEquals(1, response.getForecast().size());
        assertEquals(425.25, response.getForecast().get(0).getPredictedDemand());

        verify(forecastRepository, times(1)).save(any());
    }
}
