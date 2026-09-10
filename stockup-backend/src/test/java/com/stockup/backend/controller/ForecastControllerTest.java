package com.stockup.backend.controller;

import com.stockup.backend.model.Forecast;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ForecastRepository;
import com.stockup.backend.repository.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
public class ForecastControllerTest {

    @Mock
    private ForecastRepository forecastRepository;

    @Mock
    private ItemRepository itemRepository;

    @InjectMocks
    private ForecastController forecastController;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testSave_ValidProductCode_ResolvesItemAndSavesForecast() {
        Item mockItem = new Item();
        mockItem.setId("item-uuid-1");
        mockItem.setCode("N02BE");
        mockItem.setName("Paracetamol");

        when(itemRepository.findByCodeIgnoreCase("N02BE")).thenReturn(Optional.of(mockItem));
        when(forecastRepository.save(any(Forecast.class))).thenAnswer(inv -> {
            Forecast f = inv.getArgument(0);
            f.setId("forecast-uuid-1");
            return f;
        });

        Forecast request = new Forecast();
        request.setProductCode("N02BE");
        request.setForecastDate("2026-09-10T16:00:00");
        request.setPredictedDemand(24.5);
        request.setModel("RandomForest");

        ResponseEntity<?> response = forecastController.save(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody() instanceof Forecast);
        Forecast saved = (Forecast) response.getBody();
        assertEquals("forecast-uuid-1", saved.getId());
        assertEquals("Paracetamol", saved.getProductName());
        assertNotNull(saved.getItem());
        assertEquals("item-uuid-1", saved.getItem().getId());

        verify(itemRepository, times(1)).findByCodeIgnoreCase("N02BE");
        verify(forecastRepository, times(1)).save(any(Forecast.class));
    }

    @Test
    public void testSave_UnknownProductCode_Returns404NotFound() {
        when(itemRepository.findByCodeIgnoreCase("UNKNOWN")).thenReturn(Optional.empty());

        Forecast request = new Forecast();
        request.setProductCode("UNKNOWN");
        request.setForecastDate("2026-09-10T16:00:00");
        request.setPredictedDemand(10.0);

        ResponseEntity<?> response = forecastController.save(request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.containsKey("error"));

        verify(itemRepository, times(1)).findByCodeIgnoreCase("UNKNOWN");
        verify(forecastRepository, never()).save(any());
    }

    @Test
    public void testSave_MissingProductCode_Returns400BadRequest() {
        Forecast request = new Forecast();
        request.setProductCode("");

        ResponseEntity<?> response = forecastController.save(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(itemRepository, never()).findByCodeIgnoreCase(any());
        verify(forecastRepository, never()).save(any());
    }

    @Test
    public void testHistory_WithProductCode_FiltersByProductCode() {
        Forecast f = new Forecast();
        f.setProductCode("N02BE");
        when(forecastRepository.findByProductCodeIgnoreCaseOrderByCreatedAtDesc("N02BE"))
                .thenReturn(List.of(f));

        ResponseEntity<List<Forecast>> response = forecastController.history("N02BE");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(forecastRepository, times(1)).findByProductCodeIgnoreCaseOrderByCreatedAtDesc("N02BE");
    }

    @Test
    public void testHistory_WithoutProductCode_ReturnsTop50() {
        Forecast f = new Forecast();
        when(forecastRepository.findTop50ByOrderByCreatedAtDesc()).thenReturn(List.of(f));

        ResponseEntity<List<Forecast>> response = forecastController.history(null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(forecastRepository, times(1)).findTop50ByOrderByCreatedAtDesc();
    }
}
