package com.stockup.backend.service;

import com.stockup.backend.dto.StockoutRequest;
import com.stockup.backend.dto.StockoutResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class StockoutPredictionServiceTest {

    private StockoutPredictionService service;

    @BeforeEach
    public void setUp() {
        service = new StockoutPredictionService();
    }

    @Test
    public void testHighRisk() {
        // Current: 10, Demand: 50 -> Ratio: 0.2 -> HIGH
        StockoutRequest request = new StockoutRequest("Paracetamol", 10, 50);
        StockoutResponse response = service.calculateStockoutRisk(request);

        assertEquals("HIGH", response.getRiskLevel());
        assertEquals(0.2, response.getStockCoverageRatio(), 0.001);
        assertEquals(-40, response.getExpectedShortage());
    }

    @Test
    public void testMediumRisk() {
        // Current: 60, Demand: 100 -> Ratio: 0.6 -> MEDIUM
        StockoutRequest request = new StockoutRequest("Amoxicillin", 60, 100);
        StockoutResponse response = service.calculateStockoutRisk(request);

        assertEquals("MEDIUM", response.getRiskLevel());
        assertEquals(0.6, response.getStockCoverageRatio(), 0.001);
        assertEquals(-40, response.getExpectedShortage());
    }

    @Test
    public void testLowRisk() {
        // Current: 150, Demand: 100 -> Ratio: 1.5 -> LOW
        StockoutRequest request = new StockoutRequest("Ibuprofen", 150, 100);
        StockoutResponse response = service.calculateStockoutRisk(request);

        assertEquals("LOW", response.getRiskLevel());
        assertEquals(1.5, response.getStockCoverageRatio(), 0.001);
        assertEquals(50, response.getExpectedShortage());
    }
}
