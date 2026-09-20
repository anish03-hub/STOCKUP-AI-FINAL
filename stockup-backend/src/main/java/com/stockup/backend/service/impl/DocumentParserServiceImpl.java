package com.stockup.backend.service.impl;

import com.stockup.backend.dto.document.DocumentItemPreviewDTO;
import com.stockup.backend.service.DocumentParserService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class DocumentParserServiceImpl implements DocumentParserService {

    // Regex patterns for header metadata extraction
    private static final Pattern INVOICE_PATTERN = Pattern.compile("(?i)\\b(?:invoice|inv|bill)\\s*(?:no|num|number|#|id|code|\\.)?\\s*[:#\\-]\\s*([A-Za-z0-9\\-_/]{2,30})");
    private static final Pattern SUPPLIER_PATTERN = Pattern.compile("(?i)\\b(?:supplier|vendor|distributor|billed\\s*by|seller)\\s*[:\\-]\\s*([A-Za-z0-9 \\t.,&'\\-]{3,50})");
    private static final Pattern CUSTOMER_PATTERN = Pattern.compile("(?i)\\b(?:customer|patient|bill\\s*to|sold\\s*to|buyer|client)\\s*[:\\-]\\s*([A-Za-z0-9 \\t.,&'\\-]{3,50})");
    private static final Pattern DATE_PATTERN = Pattern.compile("(?i)\\b(?:invoice\\s*date|bill\\s*date|date)\\s*[:\\-]?\\s*(\\d{1,4}[\\-/.]\\d{1,2}[\\-/.]\\d{2,4})");
    private static final Pattern TOTAL_PATTERN = Pattern.compile("(?i)\\b(?:grand\\s*total|total\\s*amount|net\\s*payable|amount\\s*due|net\\s*amount|total)\\s*[:\\-]?\\s*(?:[$₹€£]|USD|INR)?\\s*([0-9,]+(?:\\.\\d{1,2})?)");

    @Override
    public ParsedDocumentResult parsePdf(InputStream inputStream, String fileName) {
        log.info("Parsing PDF document: {}", fileName);
        String rawText = "";
        List<String> warnings = new ArrayList<>();

        try {
            byte[] bytes = inputStream.readAllBytes();
            try (PDDocument document = Loader.loadPDF(bytes)) {
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);
                rawText = stripper.getText(document);
            }
        } catch (Exception e) {
            log.error("Failed to parse PDF document {}: {}", fileName, e.getMessage());
            warnings.add("PDF text extraction warning: " + e.getMessage());
        }

        if (rawText.isBlank()) {
            warnings.add("Extracted PDF text is empty or could not be stripped (scanned image or protected).");
        }

        // Extract metadata from text
        String invoiceNumber = extractRegex(rawText, INVOICE_PATTERN);
        String supplier = extractRegex(rawText, SUPPLIER_PATTERN);
        String customer = extractRegex(rawText, CUSTOMER_PATTERN);
        String date = extractRegex(rawText, DATE_PATTERN);
        Double grandTotal = extractNumericRegex(rawText, TOTAL_PATTERN);

        String currency = "USD";
        if (rawText.contains("₹") || rawText.toUpperCase().contains("INR") || rawText.toLowerCase().contains("rupee")) {
            currency = "INR";
        }

        // Parse structured tabular items from lines
        List<DocumentItemPreviewDTO> items = extractItemsFromTextLines(rawText, warnings);

        return new ParsedDocumentResult(
                rawText,
                supplier,
                customer,
                invoiceNumber,
                date,
                grandTotal,
                currency,
                items,
                Map.of("source", "PDF_TEXT_STRIPPER"),
                warnings
        );
    }

    @Override
    public ParsedDocumentResult parseCsv(InputStream inputStream, String fileName) {
        log.info("Parsing CSV document: {}", fileName);
        List<DocumentItemPreviewDTO> items = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        Map<String, String> columnMapping = new HashMap<>();

        String invoiceNumber = null;
        String supplier = null;
        String customer = null;
        String date = null;
        Double computedGrandTotal = 0.0;
        String currency = "USD";

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            CSVParser csvParser = CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .setTrim(true)
                    .get()
                    .parse(reader);

            Map<String, Integer> headerMap = csvParser.getHeaderMap();
            if (headerMap == null || headerMap.isEmpty()) {
                warnings.add("CSV file does not contain a recognizable header row.");
                return new ParsedDocumentResult("", null, null, null, null, 0.0, "USD", List.of(), Map.of(), warnings);
            }

            // Identify column mappings
            String nameCol = findHeader(headerMap, "medicine_name", "medicinename", "medicine", "drug_name", "drug", "product_name", "product", "item_name", "item", "name", "description");
            String codeCol = findHeader(headerMap, "code", "item_code", "medicine_code", "product_code", "ndc", "ndc_code", "sku", "id");
            String qtyCol = findHeader(headerMap, "qty", "quantity", "stock", "stock_quantity", "units", "quantity_sold", "quantity_purchased", "ordered_qty", "count");
            String priceCol = findHeader(headerMap, "unit_price", "unitprice", "price", "rate", "cost", "unit_cost", "mrp", "amount");
            String totalCol = findHeader(headerMap, "total", "total_price", "total_amount", "subtotal", "line_total", "amount_total");
            String catCol = findHeader(headerMap, "category", "therapeutic_class", "drug_class", "type");
            String formCol = findHeader(headerMap, "dosage_form", "form", "dosage", "strength");
            String expCol = findHeader(headerMap, "expiry", "expiry_date", "exp_date", "expiration_date", "exp");
            String batchCol = findHeader(headerMap, "batch", "batch_no", "batch_number", "lot", "lot_no");

            String invCol = findHeader(headerMap, "invoice_no", "invoice_number", "invoiceno", "invoice", "bill_no", "bill_number");
            String suppCol = findHeader(headerMap, "supplier", "supplier_name", "vendor", "distributor");
            String custCol = findHeader(headerMap, "customer", "customer_name", "patient", "client");
            String dateCol = findHeader(headerMap, "date", "invoice_date", "bill_date", "tx_date");

            if (nameCol != null) columnMapping.put("medicineName", nameCol);
            if (codeCol != null) columnMapping.put("medicineCode", codeCol);
            if (qtyCol != null) columnMapping.put("quantity", qtyCol);
            if (priceCol != null) columnMapping.put("unitPrice", priceCol);
            if (catCol != null) columnMapping.put("category", catCol);

            int rowIndex = 1;
            for (CSVRecord record : csvParser) {
                String medicineName = nameCol != null && record.isSet(nameCol) ? record.get(nameCol).trim() : null;
                if (medicineName == null || medicineName.isBlank()) {
                    continue; // Skip empty rows
                }

                String medicineCode = codeCol != null && record.isSet(codeCol) ? record.get(codeCol).trim() : null;
                String category = catCol != null && record.isSet(catCol) ? record.get(catCol).trim() : "General Medicine";
                String dosageForm = formCol != null && record.isSet(formCol) ? record.get(formCol).trim() : null;
                String expDate = expCol != null && record.isSet(expCol) ? record.get(expCol).trim() : null;
                String batch = batchCol != null && record.isSet(batchCol) ? record.get(batchCol).trim() : null;

                Integer qty = 1;
                if (qtyCol != null && record.isSet(qtyCol)) {
                    qty = parseIntegerSafe(record.get(qtyCol), 1);
                }

                Double unitPrice = 0.0;
                if (priceCol != null && record.isSet(priceCol)) {
                    String rawPrice = record.get(priceCol);
                    if (rawPrice.contains("₹") || rawPrice.toUpperCase().contains("INR")) {
                        currency = "INR";
                    }
                    unitPrice = parseDoubleSafe(rawPrice, 0.0);
                }

                Double totalPrice = unitPrice * qty;
                if (totalCol != null && record.isSet(totalCol)) {
                    totalPrice = parseDoubleSafe(record.get(totalCol), totalPrice);
                }

                if (invCol != null && record.isSet(invCol) && invoiceNumber == null) {
                    invoiceNumber = record.get(invCol).trim();
                }
                if (suppCol != null && record.isSet(suppCol) && supplier == null) {
                    supplier = record.get(suppCol).trim();
                }
                if (custCol != null && record.isSet(custCol) && customer == null) {
                    customer = record.get(custCol).trim();
                }
                if (dateCol != null && record.isSet(dateCol) && date == null) {
                    date = record.get(dateCol).trim();
                }

                computedGrandTotal += totalPrice;

                DocumentItemPreviewDTO itemDto = DocumentItemPreviewDTO.builder()
                        .rowIndex(rowIndex++)
                        .medicineName(medicineName)
                        .medicineCode(medicineCode)
                        .category(category)
                        .dosageForm(dosageForm)
                        .quantityChange(qty)
                        .unitPrice(unitPrice)
                        .totalPrice(totalPrice)
                        .expiryDate(expDate)
                        .batchNumber(batch)
                        .action("REVIEW")
                        .status("MATCHED")
                        .build();

                items.add(itemDto);
            }
        } catch (Exception e) {
            log.error("Failed to parse CSV document {}: {}", fileName, e.getMessage());
            warnings.add("CSV parsing error: " + e.getMessage());
        }

        return new ParsedDocumentResult(
                "Parsed " + items.size() + " CSV rows from " + fileName,
                supplier,
                customer,
                invoiceNumber,
                date,
                computedGrandTotal > 0 ? computedGrandTotal : null,
                currency,
                items,
                columnMapping,
                warnings
        );
    }

    private List<DocumentItemPreviewDTO> extractItemsFromTextLines(String rawText, List<String> warnings) {
        List<DocumentItemPreviewDTO> items = new ArrayList<>();
        if (rawText == null || rawText.isBlank()) return items;

        String[] lines = rawText.split("\\r?\\n");
        int rowIndex = 1;

        // Pattern for table rows with: Name, Qty, Price, Total (flexible separators: tabs, multiple spaces, pipes, commas)
        // Example: "Paracetamol 500mg | 100 | $2.50 | $250.00" or "Amoxicillin 500mg   50   20.00   1000.00"
        Pattern tableRowPattern = Pattern.compile("^\\s*([A-Za-z0-9\\s.,+\\-/()]{3,50})\\s*(?:[|\\t,]|\\s{2,})\\s*(\\d{1,6})\\s*(?:[|\\t,]|\\s{2,})\\s*(?:[$₹€£]?\\s*([0-9,]+(?:\\.\\d{1,2})?))\\s*(?:[|\\t,]|\\s{2,})?\\s*(?:[$₹€£]?\\s*([0-9,]+(?:\\.\\d{1,2})?))?");

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.length() < 5) continue;
            if (isHeaderOrFooterLine(trimmed)) continue;

            Matcher matcher = tableRowPattern.matcher(trimmed);
            if (matcher.find()) {
                String medName = matcher.group(1).trim();
                String qtyStr = matcher.group(2);
                String priceStr = matcher.group(3);
                String totalStr = matcher.group(4);

                if (medName.equalsIgnoreCase("Item") || medName.equalsIgnoreCase("Medicine") || medName.equalsIgnoreCase("Description")) {
                    continue; // Header row
                }

                int qty = parseIntegerSafe(qtyStr, 1);
                double price = parseDoubleSafe(priceStr, 0.0);
                double total = totalStr != null ? parseDoubleSafe(totalStr, price * qty) : (price * qty);

                items.add(DocumentItemPreviewDTO.builder()
                        .rowIndex(rowIndex++)
                        .medicineName(medName)
                        .quantityChange(qty)
                        .unitPrice(price)
                        .totalPrice(total)
                        .action("REVIEW")
                        .status("MATCHED")
                        .build());
            } else {
                // Check if line is a simpler format: "Paracetamol 500mg (Qty: 100, Price: ₹20)" or "10x Amoxicillin @ $15"
                Pattern altPattern = Pattern.compile("(?i)^([A-Za-z0-9\\s.,+\\-/()]{3,40})(?:\\s*[-:]|\\s+)(?:qty|quantity|count)?\\s*[:=]?\\s*(\\d{1,6})(?:\\s*[,|x@]\\s*(?:price|rate|cost|at)?\\s*[:=]?\\s*[$₹€£]?\\s*([0-9,]+(?:\\.\\d{1,2})?))?");
                Matcher altMatcher = altPattern.matcher(trimmed);
                if (altMatcher.find()) {
                    String name = altMatcher.group(1).trim().replaceAll("(?i)\\s*[-:]?\\s*(?:qty|quantity|count)\\s*$", "").trim();
                    if (!isHeaderOrFooterLine(name)) {
                        int qty = parseIntegerSafe(altMatcher.group(2), 1);
                        double price = parseDoubleSafe(altMatcher.group(3), 0.0);

                        items.add(DocumentItemPreviewDTO.builder()
                                .rowIndex(rowIndex++)
                                .medicineName(name)
                                .quantityChange(qty)
                                .unitPrice(price)
                                .totalPrice(price * qty)
                                .action("REVIEW")
                                .status("MATCHED")
                                .build());
                    }
                }
            }
        }

        if (items.isEmpty() && rawText.length() > 50) {
            warnings.add("Table extraction found 0 structured lines. Document text will be processed through fuzzy text parsing.");
        }

        return items;
    }

    private boolean isHeaderOrFooterLine(String line) {
        String lower = line.toLowerCase();
        return lower.contains("subtotal") || lower.contains("grand total") || lower.contains("tax (")
                || lower.contains("invoice #") || lower.contains("page ") || lower.contains("thank you")
                || lower.contains("authorized signatory") || lower.contains("terms & conditions");
    }

    private String findHeader(Map<String, Integer> headerMap, String... aliases) {
        for (String alias : aliases) {
            for (String key : headerMap.keySet()) {
                String normalizedKey = key.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
                String normalizedAlias = alias.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
                if (normalizedKey.equals(normalizedAlias)) {
                    return key;
                }
            }
        }
        return null;
    }

    private String extractRegex(String text, Pattern pattern) {
        if (text == null) return null;
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    private Double extractNumericRegex(String text, Pattern pattern) {
        String val = extractRegex(text, pattern);
        return parseDoubleSafe(val, null);
    }

    private Integer parseIntegerSafe(String str, Integer fallback) {
        if (str == null) return fallback;
        try {
            String cleaned = str.replaceAll("[^0-9\\-]", "").trim();
            if (cleaned.isEmpty()) return fallback;
            return Integer.parseInt(cleaned);
        } catch (Exception e) {
            return fallback;
        }
    }

    private Double parseDoubleSafe(String str, Double fallback) {
        if (str == null) return fallback;
        try {
            String cleaned = str.replaceAll("[^0-9.\\-]", "").trim();
            if (cleaned.isEmpty()) return fallback;
            return Double.parseDouble(cleaned);
        } catch (Exception e) {
            return fallback;
        }
    }
}
