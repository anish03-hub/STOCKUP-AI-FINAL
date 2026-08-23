package com.stockup.backend.service;

import com.stockup.backend.dto.ActionItemDTO;
import com.stockup.backend.dto.DashboardSummaryDTO;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class InventoryHealthService {

    private final ItemRepository itemRepository;

    @Autowired
    public InventoryHealthService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    public DashboardSummaryDTO getDashboardSummary() {
        List<Item> allItems = itemRepository.findAll();
        LocalDate today = LocalDate.now();

        double totalInventoryValue = 0.0;
        int lowStockCount = 0;
        int criticalExpiryCount = 0;
        double spoilageRiskValue = 0.0;

        for (Item item : allItems) {
            int quantity = item.getQuantity() != null ? item.getQuantity() : 0;
            double price = item.getPrice() != null ? item.getPrice() : 0.0;
            
            totalInventoryValue += (quantity * price);

            // Low Stock Check (threshold: 20 units)
            if (quantity <= 20) {
                lowStockCount++;
            }

            // Expiry Check
            if (item.getExpiryDate() != null && !item.getExpiryDate().trim().isEmpty()) {
                LocalDate expiryDate = parseDateSafely(item.getExpiryDate());
                if (expiryDate != null) {
                    long daysUntilExpiry = ChronoUnit.DAYS.between(today, expiryDate);
                    if (daysUntilExpiry <= 30) {
                        criticalExpiryCount++;
                        spoilageRiskValue += (quantity * price);
                    }
                }
            }
        }

        // Generate Action Items
        List<ActionItemDTO> actionItems = new ArrayList<>();
        if (criticalExpiryCount > 0) {
            actionItems.add(new ActionItemDTO("URGENT", 
                    criticalExpiryCount + " items are expiring within 30 days! Immediate action required.", "/expiry"));
        }
        if (lowStockCount > 0) {
            actionItems.add(new ActionItemDTO("WARNING", 
                    lowStockCount + " items have critically low stock (<= 20 units). Consider optimizing reorders.", "/reorder"));
        }
        if (actionItems.isEmpty()) {
            actionItems.add(new ActionItemDTO("INFO", 
                    "All inventory metrics are healthy! No urgent actions required.", "/prediction"));
        }

        return new DashboardSummaryDTO(
                totalInventoryValue,
                allItems.size(),
                lowStockCount,
                criticalExpiryCount,
                spoilageRiskValue,
                actionItems
        );
    }

    private LocalDate parseDateSafely(String dateStr) {
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException e) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("M/d/yyyy");
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException ex) {
                return null;
            }
        }
    }
}
