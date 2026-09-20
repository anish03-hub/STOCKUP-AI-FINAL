package com.stockup.backend.service;

import com.stockup.backend.dto.ExpiryAlertSummary;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.stockup.backend.security.CurrentUserService;

public class ExpiryAlertServiceTest {

    private ItemRepository itemRepository;
    private CurrentUserService currentUserService;
    private ExpiryAlertService service;

    @BeforeEach
    public void setUp() {
        itemRepository = Mockito.mock(ItemRepository.class);
        currentUserService = Mockito.mock(CurrentUserService.class);
        service = new ExpiryAlertService(itemRepository, currentUserService);
    }

    @Test
    public void testGetExpiryAlerts() {
        LocalDate today = LocalDate.now();

        Item criticalItem = new Item();
        criticalItem.setName("Critical Med");
        criticalItem.setExpiryDate(today.plusDays(10).toString());
        criticalItem.setQuantity(100);
        criticalItem.setPrice(5.0);

        Item warningItem = new Item();
        warningItem.setName("Warning Med");
        warningItem.setExpiryDate(today.plusDays(50).toString());
        warningItem.setQuantity(200);
        warningItem.setPrice(2.0);

        Item safeItem = new Item();
        safeItem.setName("Safe Med");
        safeItem.setExpiryDate(today.plusDays(150).toString());
        safeItem.setQuantity(50);
        safeItem.setPrice(10.0);

        Mockito.when(itemRepository.findAll()).thenReturn(Arrays.asList(criticalItem, warningItem, safeItem));

        ExpiryAlertSummary summary = service.getExpiryAlerts();

        assertEquals(1, summary.getTotalCriticalItems());
        assertEquals(1, summary.getTotalWarningItems());
        assertEquals(1, summary.getTotalSafeItems());
        assertEquals(2, summary.getAtRiskItems().size());

        // Value = (100 * 5) + (200 * 2) = 500 + 400 = 900
        assertEquals(900.0, summary.getTotalAtRiskValue());
    }
}
