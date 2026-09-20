package com.stockup.backend.controller;

import com.stockup.backend.dto.billing.CreateSaleRequestDTO;
import com.stockup.backend.dto.billing.InvoiceDTO;
import com.stockup.backend.dto.billing.SaleResponseDTO;
import com.stockup.backend.service.SaleTransactionService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/sales/billing")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class SaleBillingController {

    private final SaleTransactionService saleTransactionService;

    public SaleBillingController(SaleTransactionService saleTransactionService) {
        this.saleTransactionService = saleTransactionService;
    }

    /**
     * Create a Point of Sale (POS) transaction: atomically deducts stock from the items table,
     * updates item status, checks low stock threshold, and returns an invoice receipt.
     */
    @PostMapping("/create")
    public ResponseEntity<SaleResponseDTO> createSale(@Valid @RequestBody CreateSaleRequestDTO request) {
        log.info("Received sale creation request for item='{}', qty={}",
                request.getItemName() != null ? request.getItemName() : request.getItemCode(),
                request.getQuantitySold());
        SaleResponseDTO response = saleTransactionService.processSale(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Get recent sales transactions for the authenticated company.
     */
    @GetMapping("/history")
    public ResponseEntity<List<SaleResponseDTO>> getSalesHistory(
            @RequestParam(defaultValue = "20") int limit) {
        List<SaleResponseDTO> history = saleTransactionService.getRecentSales(limit);
        return ResponseEntity.ok(history);
    }

    /**
     * Get invoice receipt details by invoice number.
     */
    @GetMapping("/invoice/{invoiceNumber}")
    public ResponseEntity<InvoiceDTO> getInvoice(@PathVariable String invoiceNumber) {
        InvoiceDTO invoice = saleTransactionService.getInvoice(invoiceNumber);
        return ResponseEntity.ok(invoice);
    }
}
