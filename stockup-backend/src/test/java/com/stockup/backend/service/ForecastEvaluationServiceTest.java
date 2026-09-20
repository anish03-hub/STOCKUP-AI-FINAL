package com.stockup.backend.service;

import com.stockup.backend.dto.ForecastEvaluationDTO;
import com.stockup.backend.model.Forecast;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ForecastRepository;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.service.impl.ForecastEvaluationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.stockup.backend.security.CurrentUserService;

public class ForecastEvaluationServiceTest {

    private ForecastRepository forecastRepository;
    private ItemRepository itemRepository;
    private CurrentUserService currentUserService;
    private ForecastEvaluationServiceImpl service;

    @BeforeEach
    public void setUp() {
        forecastRepository = mock(ForecastRepository.class);
        itemRepository = mock(ItemRepository.class);
        currentUserService = mock(CurrentUserService.class);
        service = new ForecastEvaluationServiceImpl(forecastRepository, itemRepository, currentUserService);
    }

    @Test
    public void testEvaluateForecasts_CalculatesMetricsCorrectly() {
        Item item = new Item();
        item.setId("item-1");
        item.setCode("0002-0213");
        item.setName("Humulin Injection, Solution");
        item.setQuantity(200);

        Forecast f1 = new Forecast();
        f1.setProductCode("0002-0213");
        f1.setPredictedDemand(10.0);
        f1.setActualDemand(12.0);
        f1.setCreatedAt(LocalDateTime.now().minusHours(2));

        Forecast f2 = new Forecast();
        f2.setProductCode("0002-0213");
        f2.setPredictedDemand(20.0);
        f2.setActualDemand(18.0);
        f2.setCreatedAt(LocalDateTime.now().minusHours(1));

        when(forecastRepository.findByProductCodeIgnoreCaseOrderByCreatedAtDesc("0002-0213"))
                .thenReturn(List.of(f1, f2));
        when(itemRepository.findByCodeIgnoreCase("0002-0213")).thenReturn(Optional.of(item));

        ForecastEvaluationDTO result = service.evaluateForecasts("0002-0213");

        assertNotNull(result);
        assertEquals("0002-0213", result.getProductCode());
        assertEquals("Humulin Injection, Solution", result.getProductName());
        assertTrue(result.getMape() >= 0.0);
        assertTrue(result.getRmse() >= 0.0);
        assertTrue(result.getAccuracyScore() > 0.0 && result.getAccuracyScore() <= 100.0);
        assertNotNull(result.getDataPoints());
        assertTrue(result.getDataPoints().size() >= 2);
    }

    @Test
    public void testEvaluateForecasts_BackfillsWhenNoForecastsExist() {
        when(forecastRepository.findByProductCodeIgnoreCaseOrderByCreatedAtDesc("UNKNOWN"))
                .thenReturn(List.of());
        when(itemRepository.findByCodeIgnoreCase("UNKNOWN")).thenReturn(Optional.empty());

        ForecastEvaluationDTO result = service.evaluateForecasts("UNKNOWN");

        assertNotNull(result);
        assertEquals("UNKNOWN", result.getProductCode());
        assertEquals(7, result.getDataPoints().size());
        assertTrue(result.getMape() >= 0.0);
        assertTrue(result.getRmse() >= 0.0);
    }
}
