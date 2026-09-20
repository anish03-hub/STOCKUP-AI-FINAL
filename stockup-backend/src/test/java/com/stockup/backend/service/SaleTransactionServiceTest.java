package com.stockup.backend.service;

import com.stockup.backend.dto.billing.CreateSaleRequestDTO;
import com.stockup.backend.dto.billing.SaleResponseDTO;
import com.stockup.backend.exception.InsufficientStockException;
import com.stockup.backend.model.Item;
import com.stockup.backend.model.SaleTransaction;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.repository.SaleTransactionRepository;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.service.impl.SaleTransactionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SaleTransactionServiceTest {

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private SaleTransactionRepository saleTransactionRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private SaleTransactionServiceImpl saleTransactionService;

    private final String TENANT_ID = "tenant-test-123";
    private Item testParacetamol;

    @BeforeEach
    void setUp() {
        testParacetamol = new Item();
        testParacetamol.setId("item-para-1");
        testParacetamol.setName("Paracetamol");
        testParacetamol.setCode("N02BE");
        testParacetamol.setQuantity(50);
        testParacetamol.setPrice(1.5);
        testParacetamol.setSellingPrice(3.0);
        testParacetamol.setStatus("In Stock");
        testParacetamol.setBusinessId(TENANT_ID);
    }

    @Test
    void testProcessSale_50BoxesMinus40_Becomes10AndTriggersLowStock() {
        when(currentUserService.getCurrentUserBusinessId()).thenReturn(TENANT_ID);
        when(currentUserService.getCurrentUserEmail()).thenReturn("pharmacist@stockup.com");
        when(itemRepository.findByBusinessId(TENANT_ID)).thenReturn(List.of(testParacetamol));
        when(itemRepository.save(any(Item.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(saleTransactionRepository.save(any(SaleTransaction.class))).thenAnswer(invocation -> {
            SaleTransaction tx = invocation.getArgument(0);
            tx.setId("tx-123");
            return tx;
        });

        CreateSaleRequestDTO request = CreateSaleRequestDTO.builder()
                .itemName("Paracetamol")
                .quantitySold(40)
                .customerName("John Doe")
                .paymentMethod("CASH")
                .build();

        SaleResponseDTO response = saleTransactionService.processSale(request);

        assertNotNull(response);
        assertEquals("Paracetamol", response.getItemName());
        assertEquals(50, response.getStockBefore());
        assertEquals(40, response.getQuantitySold());
        assertEquals(10, response.getStockAfter());
        assertEquals(120.0, response.getTotalAmount()); // 40 * 3.0
        assertEquals("Low Stock", response.getItemStatus());
        assertTrue(response.getIsLowStock());
        assertNotNull(response.getAlertMessage());
        assertTrue(response.getAlertMessage().contains("10 boxes remaining"));
        assertTrue(response.getInvoiceNumber().startsWith("INV-"));

        verify(itemRepository).save(argThat(i -> i.getQuantity() == 10 && "Low Stock".equals(i.getStatus())));
        verify(saleTransactionRepository).save(any(SaleTransaction.class));
    }

    @Test
    void testProcessSale_InsufficientStock_ThrowsException() {
        testParacetamol.setQuantity(10);
        when(currentUserService.getCurrentUserBusinessId()).thenReturn(TENANT_ID);
        when(currentUserService.getCurrentUserEmail()).thenReturn("pharmacist@stockup.com");
        when(itemRepository.findByBusinessId(TENANT_ID)).thenReturn(List.of(testParacetamol));

        CreateSaleRequestDTO request = CreateSaleRequestDTO.builder()
                .itemName("Paracetamol")
                .quantitySold(20)
                .build();

        InsufficientStockException ex = assertThrows(
                InsufficientStockException.class,
                () -> saleTransactionService.processSale(request)
        );

        assertTrue(ex.getMessage().contains("Current stock: 10 boxes, Requested: 20 boxes"));
        verify(itemRepository, never()).save(any());
        verify(saleTransactionRepository, never()).save(any());
    }

    @Test
    void testProcessSale_ZeroStock_BecomesOutOfStock() {
        testParacetamol.setQuantity(10);
        when(currentUserService.getCurrentUserBusinessId()).thenReturn(TENANT_ID);
        when(currentUserService.getCurrentUserEmail()).thenReturn("pharmacist@stockup.com");
        when(itemRepository.findByBusinessId(TENANT_ID)).thenReturn(List.of(testParacetamol));
        when(itemRepository.save(any(Item.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(saleTransactionRepository.save(any(SaleTransaction.class))).thenAnswer(invocation -> {
            SaleTransaction tx = invocation.getArgument(0);
            tx.setId("tx-zero");
            return tx;
        });

        CreateSaleRequestDTO request = CreateSaleRequestDTO.builder()
                .itemName("Paracetamol")
                .quantitySold(10)
                .build();

        SaleResponseDTO response = saleTransactionService.processSale(request);

        assertEquals(0, response.getStockAfter());
        assertEquals("Out of Stock", response.getItemStatus());
        assertTrue(response.getIsLowStock());
    }
}
