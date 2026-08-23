package com.stockup.backend.service;

import com.stockup.backend.dto.ExpiryAlertSummary;
import com.stockup.backend.dto.ExpiryItemDetails;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class ExpiryAlertService {

    private final ItemRepository itemRepository;

    @Autowired
    public ExpiryAlertService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    public ExpiryAlertSummary getExpiryAlerts() {
        List<Item> allItems = itemRepository.findAll();
        LocalDate today = LocalDate.now();

        int criticalCount = 0;
        int warningCount = 0;
        int safeCount = 0;
        double totalAtRiskValue = 0.0;
        List<ExpiryItemDetails> atRiskItems = new ArrayList<>();

        for (Item item : allItems) {
            if (item.getExpiryDate() == null || item.getExpiryDate().trim().isEmpty()) {
                continue;
            }

            LocalDate expiryDate = parseDateSafely(item.getExpiryDate());
            if (expiryDate == null) {
                continue; // Skip invalid dates
            }

            long daysUntilExpiry = ChronoUnit.DAYS.between(today, expiryDate);
            
            int quantity = item.getQuantity() != null ? item.getQuantity() : 0;
            double price = item.getPrice() != null ? item.getPrice() : 0.0;
            double financialRisk = quantity * price;

            String riskLevel;
            if (daysUntilExpiry <= 30) {
                riskLevel = "CRITICAL";
                criticalCount++;
                totalAtRiskValue += financialRisk;
            } else if (daysUntilExpiry <= 90) {
                riskLevel = "WARNING";
                warningCount++;
                totalAtRiskValue += financialRisk;
            } else {
                riskLevel = "SAFE";
                safeCount++;
                financialRisk = 0; // Only calculate risk value for critical/warning
            }

            if (!"SAFE".equals(riskLevel)) {
                ExpiryItemDetails details = new ExpiryItemDetails(
                        item.getName(),
                        item.getCategory(),
                        item.getManufacturer(),
                        quantity,
                        price,
                        item.getExpiryDate(),
                        daysUntilExpiry,
                        riskLevel,
                        financialRisk
                );
                atRiskItems.add(details);
            }
        }

        // Sort items by days until expiry (most urgent first)
        atRiskItems.sort(Comparator.comparingLong(item -> item == null ? 0L : item.getDaysUntilExpiry()));

        return new ExpiryAlertSummary(criticalCount, warningCount, safeCount, totalAtRiskValue, atRiskItems);
    }

    private LocalDate parseDateSafely(String dateStr) {
        try {
            // First attempt: Standard ISO format yyyy-MM-dd
            return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException e) {
            try {
                // Second attempt: M/d/yyyy or MM/dd/yyyy
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("M/d/yyyy");
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException ex) {
                return null;
            }
        }
    }
}
