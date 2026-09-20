package com.stockup.backend.service;

import com.stockup.backend.dto.ActionItemDTO;
import com.stockup.backend.dto.DashboardSummaryDTO;
import com.stockup.backend.model.Business;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.repository.SupplierRepository;
import com.stockup.backend.security.CurrentUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class InventoryHealthService {

    private final ItemRepository itemRepository;
    private final BusinessRepository businessRepository;
    private final SupplierRepository supplierRepository;
    private final CurrentUserService currentUserService;

    @Autowired
    public InventoryHealthService(
            ItemRepository itemRepository,
            BusinessRepository businessRepository,
            SupplierRepository supplierRepository,
            CurrentUserService currentUserService
    ) {
        this.itemRepository = itemRepository;
        this.businessRepository = businessRepository;
        this.supplierRepository = supplierRepository;
        this.currentUserService = currentUserService;
    }

    public DashboardSummaryDTO getDashboardSummary() {
        Optional<String> businessIdOpt = currentUserService.getCurrentUserBusinessIdOptional();
        List<Item> allItems = businessIdOpt.isPresent()
                ? itemRepository.findByBusinessId(businessIdOpt.get())
                : itemRepository.findAll();
        
        String businessName = "StockUp AI";
        long totalSuppliers = 0;

        if (businessIdOpt.isPresent()) {
            businessName = businessRepository.findById(businessIdOpt.get())
                    .map(Business::getBusinessName)
                    .orElse("StockUp Pharmacy");
            totalSuppliers = supplierRepository.countByBusinessId(businessIdOpt.get());
        } else {
            totalSuppliers = supplierRepository.count();
        }

        LocalDate today = LocalDate.now();

        double totalInventoryValue = 0.0;
        int lowStockCount = 0;
        int criticalExpiryCount = 0;
        double spoilageRiskValue = 0.0;

        for (Item item : allItems) {
            int quantity = item.getQuantity() != null ? item.getQuantity() : 0;
            double price = item.getPrice() != null ? item.getPrice() : 0.0;
            
            totalInventoryValue += (quantity * price);

            // Low Stock Check (threshold: 50 units)
            if (quantity <= 50) {
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
                    criticalExpiryCount + " medicines expire within 30 days! Immediate action required.", "/expiry"));
        }
        if (lowStockCount > 0) {
            actionItems.add(new ActionItemDTO("WARNING", 
                    lowStockCount + " medicines have critically low stock (<= 50 units). Consider optimizing reorders.", "/reorder"));
        }
        if (actionItems.isEmpty()) {
            actionItems.add(new ActionItemDTO("INFO", 
                    "All inventory metrics are healthy. No urgent actions required.", "/medicines"));
        }

        return new DashboardSummaryDTO(
                businessName,
                totalInventoryValue,
                allItems.size(),
                lowStockCount,
                criticalExpiryCount,
                spoilageRiskValue,
                totalSuppliers,
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

