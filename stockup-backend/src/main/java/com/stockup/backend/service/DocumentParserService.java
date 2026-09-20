package com.stockup.backend.service;

import com.stockup.backend.dto.document.DocumentItemPreviewDTO;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

public interface DocumentParserService {

    /**
     * Parse raw text and extract structured items and metadata from a PDF file.
     */
    ParsedDocumentResult parsePdf(InputStream inputStream, String fileName);

    /**
     * Parse structured items and metadata from a CSV file.
     */
    ParsedDocumentResult parseCsv(InputStream inputStream, String fileName);

    /**
     * Internal container holding parsed document text, detected metadata, and extracted rows.
     */
    record ParsedDocumentResult(
            String rawText,
            String detectedSupplier,
            String detectedCustomer,
            String detectedInvoiceNumber,
            String detectedDate,
            Double detectedGrandTotal,
            String detectedCurrency,
            List<DocumentItemPreviewDTO> items,
            Map<String, String> columnMapping,
            List<String> parseWarnings
    ) {}
}
