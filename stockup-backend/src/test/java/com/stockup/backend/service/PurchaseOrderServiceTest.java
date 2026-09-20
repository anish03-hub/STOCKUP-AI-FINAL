package com.stockup.backend.service;

import com.stockup.backend.dto.PurchaseOrderRequest;
import com.stockup.backend.dto.PurchaseOrderResponse;
import com.stockup.backend.dto.PurchaseOrderSummaryDTO;
import com.stockup.backend.model.Item;
import com.stockup.backend.model.PurchaseOrder;
import com.stockup.backend.model.PurchaseOrderStatus;
import com.stockup.backend.model.Supplier;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.repository.PurchaseOrderRepository;
import com.stockup.backend.repository.SupplierRepository;
import com.stockup.backend.service.impl.PurchaseOrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.stockup.backend.security.CurrentUserService;

public class PurchaseOrderServiceTest {

    private PurchaseOrderRepository purchaseOrderRepository;
    private ItemRepository itemRepository;
    private SupplierRepository supplierRepository;
    private CurrentUserService currentUserService;
    private PurchaseOrderServiceImpl service;

    @BeforeEach
    public void setUp() {
        purchaseOrderRepository = mock(PurchaseOrderRepository.class);
        itemRepository = mock(ItemRepository.class);
        supplierRepository = mock(SupplierRepository.class);
        currentUserService = mock(CurrentUserService.class);
        service = new PurchaseOrderServiceImpl(purchaseOrderRepository, itemRepository, supplierRepository, currentUserService);
    }

    @Test
    public void testCreatePurchaseOrder() {
        PurchaseOrderRequest request = new PurchaseOrderRequest();
        request.setItemCode("0002-0213");
        request.setQuantityOrdered(150);
        request.setUnitPrice(44.88);
        request.setPriority("High");
        request.setExpectedDeliveryDate("2026-09-20");

        Item item = new Item();
        item.setId("item-uuid-1");
        item.setCode("0002-0213");
        item.setName("Humulin Injection, Solution");
        when(itemRepository.findByCodeIgnoreCase("0002-0213")).thenReturn(Optional.of(item));

        when(purchaseOrderRepository.findByPoNumber(any())).thenReturn(Optional.empty());
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> {
            PurchaseOrder po = invocation.getArgument(0);
            po.setId("po-uuid-1");
            return po;
        });

        PurchaseOrderResponse response = service.createPurchaseOrder(request);

        assertNotNull(response);
        assertEquals("po-uuid-1", response.getId());
        assertEquals("0002-0213", response.getItemCode());
        assertEquals("Humulin Injection, Solution", response.getItemName());
        assertEquals(150, response.getQuantityOrdered());
        assertEquals(44.88, response.getUnitPrice());
        assertEquals(6732.0, response.getTotalAmount());
        assertEquals("SUBMITTED", response.getStatus());
        assertTrue(response.getPoNumber().startsWith("PO-"));
    }

    @Test
    public void testReceivePurchaseOrder_IncrementsStockAndUpdatesStatus() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId("po-uuid-1");
        po.setPoNumber("PO-2026-1041");
        po.setItemId("item-uuid-1");
        po.setItemCode("0002-0213");
        po.setSupplierId("sup-uuid-1");
        po.setQuantityOrdered(100);
        po.setUnitPrice(25.0);
        po.setTotalAmount(2500.0);
        po.setStatus(PurchaseOrderStatus.SUBMITTED);
        po.setCreatedAt(LocalDateTime.now().minusDays(1));

        Item item = new Item();
        item.setId("item-uuid-1");
        item.setCode("0002-0213");
        item.setName("Humulin Injection, Solution");
        item.setQuantity(25); // low stock
        item.setStatus("Low Stock");

        Supplier supplier = new Supplier();
        supplier.setId("sup-uuid-1");
        supplier.setName("Lilly Logistics Direct");
        supplier.setFulfilledOrders(10);

        when(purchaseOrderRepository.findById("po-uuid-1")).thenReturn(Optional.of(po));
        when(itemRepository.findById("item-uuid-1")).thenReturn(Optional.of(item));
        when(supplierRepository.findById("sup-uuid-1")).thenReturn(Optional.of(supplier));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        PurchaseOrderResponse response = service.receivePurchaseOrder("po-uuid-1");

        // Verify PO response status
        assertEquals("RECEIVED", response.getStatus());
        assertNotNull(response.getReceivedAt());

        // Verify Item stock incremented
        ArgumentCaptor<Item> itemCaptor = ArgumentCaptor.forClass(Item.class);
        verify(itemRepository).save(itemCaptor.capture());
        Item savedItem = itemCaptor.getValue();
        assertEquals(125, savedItem.getQuantity()); // 25 + 100
        assertEquals("In Stock", savedItem.getStatus()); // > 50 units

        // Verify Supplier fulfilledOrders incremented
        ArgumentCaptor<Supplier> supplierCaptor = ArgumentCaptor.forClass(Supplier.class);
        verify(supplierRepository).save(supplierCaptor.capture());
        Supplier savedSupplier = supplierCaptor.getValue();
        assertEquals(11, savedSupplier.getFulfilledOrders());
    }

    @Test
    public void testReceivePurchaseOrder_AlreadyReceived_ThrowsException() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId("po-uuid-2");
        po.setPoNumber("PO-2026-1039");
        po.setStatus(PurchaseOrderStatus.RECEIVED);

        when(purchaseOrderRepository.findById("po-uuid-2")).thenReturn(Optional.of(po));

        assertThrows(IllegalStateException.class, () -> {
            service.receivePurchaseOrder("po-uuid-2");
        });
    }

    @Test
    public void testGetSummary() {
        PurchaseOrder po1 = new PurchaseOrder();
        po1.setStatus(PurchaseOrderStatus.SUBMITTED);
        po1.setTotalAmount(1500.0);

        PurchaseOrder po2 = new PurchaseOrder();
        po2.setStatus(PurchaseOrderStatus.RECEIVED);
        po2.setTotalAmount(2500.0);

        PurchaseOrder po3 = new PurchaseOrder();
        po3.setStatus(PurchaseOrderStatus.DRAFT);
        po3.setTotalAmount(500.0);

        when(purchaseOrderRepository.findAll()).thenReturn(List.of(po1, po2, po3));

        PurchaseOrderSummaryDTO summary = service.getSummary();
        assertEquals(3, summary.getTotalOrders());
        assertEquals(1, summary.getSubmittedOrders());
        assertEquals(1, summary.getReceivedOrders());
        assertEquals(1, summary.getDraftOrders());
        assertEquals(2500.0, summary.getTotalSpend());
    }
}
