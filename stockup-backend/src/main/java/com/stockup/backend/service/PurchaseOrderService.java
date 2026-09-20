package com.stockup.backend.service;

import com.stockup.backend.dto.PurchaseOrderRequest;
import com.stockup.backend.dto.PurchaseOrderResponse;
import com.stockup.backend.dto.PurchaseOrderSummaryDTO;

import java.util.List;

public interface PurchaseOrderService {

    PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request);

    List<PurchaseOrderResponse> getAllPurchaseOrders();

    List<PurchaseOrderResponse> getPurchaseOrdersByStatus(String status);

    PurchaseOrderResponse getPurchaseOrderById(String id);

    PurchaseOrderResponse updateStatus(String id, String newStatus);

    PurchaseOrderResponse receivePurchaseOrder(String id);

    void deletePurchaseOrder(String id);

    PurchaseOrderSummaryDTO getSummary();
}
