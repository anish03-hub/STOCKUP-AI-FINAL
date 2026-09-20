package com.stockup.backend.service;

import com.stockup.backend.dto.DashboardSummaryDTO;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.repository.SupplierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.stockup.backend.security.CurrentUserService;

public class InventoryHealthServiceTest {

    private ItemRepository itemRepository;
    private BusinessRepository businessRepository;
    private SupplierRepository supplierRepository;
    private CurrentUserService currentUserService;
    private InventoryHealthService service;

    @BeforeEach
    public void setUp() {
        itemRepository = Mockito.mock(ItemRepository.class);
        businessRepository = Mockito.mock(BusinessRepository.class);
        supplierRepository = Mockito.mock(SupplierRepository.class);
        currentUserService = Mockito.mock(CurrentUserService.class);
        service = new InventoryHealthService(itemRepository, businessRepository, supplierRepository, currentUserService);
    }

    @Test
    public void testGetDashboardSummary() {
        LocalDate today = LocalDate.now();

        Item item1 = new Item();
        item1.setName("Item 1");
        item1.setQuantity(10); // Low stock (<= 50)
        item1.setPrice(15.0);
        item1.setExpiryDate(today.plusDays(10).toString()); // Critical expiry

        Item item2 = new Item();
        item2.setName("Item 2");
        item2.setQuantity(100);
        item2.setPrice(20.0);
        item2.setExpiryDate(today.plusDays(100).toString()); // Safe

        Mockito.when(itemRepository.findAll()).thenReturn(Arrays.asList(item1, item2));
        Mockito.when(supplierRepository.count()).thenReturn(14L);

        DashboardSummaryDTO summary = service.getDashboardSummary();

        assertEquals(2, summary.getTotalItems());
        assertEquals(2150.0, summary.getTotalInventoryValue()); // (10*15) + (100*20) = 150 + 2000 = 2150
        assertEquals(1, summary.getLowStockItemsCount());
        assertEquals(1, summary.getCriticalExpiryItemsCount());
        assertEquals(150.0, summary.getSpoilageRiskValue());
        assertEquals(14L, summary.getTotalSuppliers());
        assertEquals(2, summary.getActionItems().size()); // URGENT and WARNING
    }
}

