package com.stockup.backend.controller;

import com.stockup.backend.dto.currency.CurrencySettingDTO;
import com.stockup.backend.dto.currency.ExchangeRatesResponseDTO;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private static final java.util.Set<String> SUPPORTED_CURRENCIES = java.util.Set.of("USD", "INR");

    private final ExchangeRateService exchangeRateService;
    private final BusinessRepository businessRepository;
    private final CurrentUserService currentUserService;

    @GetMapping("/rates")
    public ResponseEntity<ExchangeRatesResponseDTO> getRates(
            @RequestParam(name = "base", defaultValue = "USD") String base) {
        ExchangeRatesResponseDTO response = exchangeRateService.getLatestRates(base);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/rate")
    public ResponseEntity<Map<String, Object>> getSingleRate(
            @RequestParam(name = "base", defaultValue = "USD") String base,
            @RequestParam(name = "target", defaultValue = "INR") String target) {
        String targetCurr = SUPPORTED_CURRENCIES.contains(target.toUpperCase()) ? target.toUpperCase() : "USD";
        Double rate = exchangeRateService.getExchangeRate(base, targetCurr);
        ExchangeRatesResponseDTO ratesDto = exchangeRateService.getLatestRates(base);
        return ResponseEntity.ok(Map.of(
                "base", base.toUpperCase(),
                "target", targetCurr,
                "rate", rate,
                "cached", ratesDto.isCached(),
                "lastUpdated", ratesDto.getLastUpdated(),
                "lastUpdatedFormatted", ratesDto.getLastUpdatedFormatted(),
                "provider", ratesDto.getProvider()
        ));
    }

    @GetMapping("/settings")
    public ResponseEntity<CurrencySettingDTO> getCurrencySettings() {
        String businessId = currentUserService.getCurrentUserBusinessId();
        String selectedCurrency = "USD";

        if (businessId != null && !businessId.isBlank()) {
            selectedCurrency = businessRepository.findById(businessId)
                    .map(b -> b.getCurrency())
                    .filter(c -> c != null && !c.isBlank() && SUPPORTED_CURRENCIES.contains(c.toUpperCase()))
                    .orElse("USD");
        }

        Double rate = exchangeRateService.getExchangeRate("USD", selectedCurrency);
        ExchangeRatesResponseDTO ratesDto = exchangeRateService.getLatestRates("USD");

        return ResponseEntity.ok(CurrencySettingDTO.builder()
                .currency(selectedCurrency)
                .baseCurrency("USD")
                .exchangeRate(rate)
                .rateUpdatedAt(ratesDto.getLastUpdatedFormatted())
                .rateSource(ratesDto.getProvider())
                .cached(ratesDto.isCached())
                .build());
    }

    @PostMapping("/settings")
    public ResponseEntity<CurrencySettingDTO> saveCurrencySettings(@RequestBody Map<String, String> request) {
        String businessId = currentUserService.getCurrentUserBusinessId();
        String rawCurrency = request.getOrDefault("currency", "USD").trim().toUpperCase();
        String newCurrency = SUPPORTED_CURRENCIES.contains(rawCurrency) ? rawCurrency : "USD";

        if (businessId != null && !businessId.isBlank()) {
            businessRepository.findById(businessId).ifPresent(business -> {
                business.setCurrency(newCurrency);
                businessRepository.save(business);
                log.info("Updated billing currency for tenant '{}' to '{}'", businessId, newCurrency);
            });
        }

        Double rate = exchangeRateService.getExchangeRate("USD", newCurrency);
        ExchangeRatesResponseDTO ratesDto = exchangeRateService.getLatestRates("USD");

        return ResponseEntity.ok(CurrencySettingDTO.builder()
                .currency(newCurrency)
                .baseCurrency("USD")
                .exchangeRate(rate)
                .rateUpdatedAt(ratesDto.getLastUpdatedFormatted())
                .rateSource(ratesDto.getProvider())
                .cached(ratesDto.isCached())
                .build());
    }
}
