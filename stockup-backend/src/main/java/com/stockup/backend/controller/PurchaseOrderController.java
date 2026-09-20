package com.stockup.backend.controller;

import com.stockup.backend.dto.PurchaseOrderRequest;
import com.stockup.backend.dto.PurchaseOrderResponse;
import com.stockup.backend.dto.PurchaseOrderStatusUpdateRequest;
import com.stockup.backend.dto.PurchaseOrderSummaryDTO;
import com.stockup.backend.service.PurchaseOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @PostMapping
    public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(@Valid @RequestBody PurchaseOrderRequest request) {
        PurchaseOrderResponse response = purchaseOrderService.createPurchaseOrder(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<PurchaseOrderResponse>> getAllPurchaseOrders(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(purchaseOrderService.getPurchaseOrdersByStatus(status));
        }
        return ResponseEntity.ok(purchaseOrderService.getAllPurchaseOrders());
    }

    @GetMapping("/summary")
    public ResponseEntity<PurchaseOrderSummaryDTO> getSummary() {
        return ResponseEntity.ok(purchaseOrderService.getSummary());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrderResponse> getPurchaseOrderById(@PathVariable String id) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrderById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PurchaseOrderResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody PurchaseOrderStatusUpdateRequest request) {
        return ResponseEntity.ok(purchaseOrderService.updateStatus(id, request.getStatus()));
    }

    @PostMapping("/{id}/receive")
    public ResponseEntity<PurchaseOrderResponse> receivePurchaseOrderPost(@PathVariable String id) {
        return ResponseEntity.ok(purchaseOrderService.receivePurchaseOrder(id));
    }

    @PutMapping("/{id}/receive")
    public ResponseEntity<PurchaseOrderResponse> receivePurchaseOrderPut(@PathVariable String id) {
        return ResponseEntity.ok(purchaseOrderService.receivePurchaseOrder(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchaseOrder(@PathVariable String id) {
        purchaseOrderService.deletePurchaseOrder(id);
        return ResponseEntity.noContent().build();
    }
}
