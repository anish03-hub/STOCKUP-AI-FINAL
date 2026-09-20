package com.stockup.backend.service;

import com.stockup.backend.service.impl.DocumentParserServiceImpl;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class DocumentParserServiceTest {

    private DocumentParserServiceImpl parserService;

    @BeforeEach
    void setUp() {
        parserService = new DocumentParserServiceImpl();
    }

    @Test
    void testParseCsvWithStandardHeaders() {
        String csvContent = "Medicine Name,Quantity,Unit Price,Category\n" +
                "Paracetamol 500mg,100,2.50,Analgesic\n" +
                "Amoxicillin 500mg,50,15.00,Antibacterial\n" +
                "Azithromycin 250mg,30,25.00,Antibiotic\n";

        ByteArrayInputStream is = new ByteArrayInputStream(csvContent.getBytes(StandardCharsets.UTF_8));
        DocumentParserService.ParsedDocumentResult result = parserService.parseCsv(is, "medicines.csv");

        assertNotNull(result);
        assertEquals(3, result.items().size());
        assertEquals("Paracetamol 500mg", result.items().get(0).getMedicineName());
        assertEquals(100, result.items().get(0).getQuantityChange());
        assertEquals(2.50, result.items().get(0).getUnitPrice());
        assertEquals(250.00, result.items().get(0).getTotalPrice());

        assertEquals("Amoxicillin 500mg", result.items().get(1).getMedicineName());
        assertEquals(50, result.items().get(1).getQuantityChange());
    }

    @Test
    void testParseCsvWithAlternateHeaders() {
        String csvContent = "Drug,Stock,Rate,Invoice_No,Supplier\n" +
                "Ibuprofen 400mg,75,4.20,INV-8891,Apex Healthcare\n" +
                "Cetirizine 10mg,120,1.80,INV-8891,Apex Healthcare\n";

        ByteArrayInputStream is = new ByteArrayInputStream(csvContent.getBytes(StandardCharsets.UTF_8));
        DocumentParserService.ParsedDocumentResult result = parserService.parseCsv(is, "purchase_record.csv");

        assertNotNull(result);
        assertEquals(2, result.items().size());
        assertEquals("Ibuprofen 400mg", result.items().get(0).getMedicineName());
        assertEquals(75, result.items().get(0).getQuantityChange());
        assertEquals("Apex Healthcare", result.detectedSupplier());
        assertEquals("INV-8891", result.detectedInvoiceNumber());
    }

    @Test
    void testParsePdfInvoiceInMemory() {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (PDDocument doc = new PDDocument()) {
                PDPage page = new PDPage();
                doc.addPage(page);

                try (PDPageContentStream stream = new PDPageContentStream(doc, page)) {
                    stream.beginText();
                    stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                    stream.newLineAtOffset(50, 700);
                    stream.showText("PURCHASE INVOICE");
                    stream.newLineAtOffset(0, -20);
                    stream.showText("Supplier: ABC Pharmaceuticals");
                    stream.newLineAtOffset(0, -20);
                    stream.showText("Invoice No: INV-2026-901");
                    stream.newLineAtOffset(0, -20);
                    stream.showText("Amoxicillin 500mg - Qty: 100 - Price: 15.50");
                    stream.endText();
                }
                doc.save(baos);
            }

            ByteArrayInputStream is = new ByteArrayInputStream(baos.toByteArray());
            DocumentParserService.ParsedDocumentResult result = parserService.parsePdf(is, "invoice_sample.pdf");

            assertNotNull(result);
            assertEquals("ABC Pharmaceuticals", result.detectedSupplier());
            assertEquals("INV-2026-901", result.detectedInvoiceNumber());
            assertFalse(result.items().isEmpty());
            assertEquals("Amoxicillin 500mg", result.items().get(0).getMedicineName());
            assertEquals(100, result.items().get(0).getQuantityChange());
        } catch (UnsatisfiedLinkError e) {
            System.err.println("Skipping PDFBox AWT test on environment where macOS libawt.dylib is restricted: " + e.getMessage());
        } catch (Exception e) {
            fail("PDF parsing failed: " + e.getMessage());
        }
    }
}
