package com.stockup.backend.service;

import com.stockup.backend.dto.billing.CreateSaleRequestDTO;
import com.stockup.backend.dto.billing.InvoiceDTO;
import com.stockup.backend.dto.billing.SaleResponseDTO;

import java.util.List;

public interface SaleTransactionService {

    /**
     * Atomically process a customer sale: deducts live inventory stock, updates item status,
     * checks low stock thresholds, generates an invoice, and records an audit trail.
     */
    SaleResponseDTO processSale(CreateSaleRequestDTO request);

    /**
     * Retrieve recent sales transactions for the authenticated company.
     */
    List<SaleResponseDTO> getRecentSales(int limit);

    /**
     * Retrieve invoice details by invoice number.
     */
    InvoiceDTO getInvoice(String invoiceNumber);
}
