package com.stockup.backend.service;

import com.stockup.backend.dto.currency.ExchangeRatesResponseDTO;
import com.stockup.backend.service.impl.ExchangeRateServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ExchangeRateServiceTest {

    private ExchangeRateServiceImpl exchangeRateService;

    @BeforeEach
    void setUp() {
        exchangeRateService = new ExchangeRateServiceImpl();
    }

    @Test
    void testSameCurrencyReturnsOne() {
        Double rateUsd = exchangeRateService.getExchangeRate("USD", "USD");
        assertEquals(1.0, rateUsd, 0.0001);

        Double rateInr = exchangeRateService.getExchangeRate("INR", "INR");
        assertEquals(1.0, rateInr, 0.0001);
    }

    @Test
    void testUsdToInrRateConversion() {
        Double inrRate = exchangeRateService.getExchangeRate("USD", "INR");
        assertNotNull(inrRate);
        assertTrue(inrRate > 80.0, "USD to INR exchange rate should be > 80");
    }

    @Test
    void testGetLatestRatesReturnsBaseAndMap() {
        ExchangeRatesResponseDTO response = exchangeRateService.getLatestRates("USD");
        assertNotNull(response);
        assertEquals("USD", response.getBase());
        assertNotNull(response.getRates());
        assertTrue(response.getRates().containsKey("USD"));
        assertTrue(response.getRates().containsKey("INR"));
        assertTrue(response.getRates().containsKey("EUR"));
    }
}
