package com.stockup.backend.service;

import com.stockup.backend.dto.ItemImportResult;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.service.impl.ItemServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;

public class ItemImportServiceTest {

    @Mock
    private ItemRepository itemRepository;

    @InjectMocks
    private ItemServiceImpl itemService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testImportValidCsv() {
        String csvContent = "name,code,category,description,manufacturer,price,sellingPrice,quantity,expiryDate,status\n" +
                "Paracetamol,N02BE,Analgesic,Pain reliever,Global Meds,1.50,3.00,150,2027-08-20,In Stock\n" +
                "Diclofenac,M01AB,Analgesic,Diclofenac Sodium 50mg,Test Pharma,8.50,12.00,50,2026-10-10,In Stock";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        Mockito.when(itemRepository.findByCodeIgnoreCase(anyString())).thenReturn(Optional.empty());
        Mockito.when(itemRepository.save(any(Item.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ItemImportResult result = itemService.importFromCsv(file);

        assertEquals(2, result.getTotalRecords());
        assertEquals(2, result.getImported());
        assertEquals(0, result.getUpdated());
        assertEquals(0, result.getErrors().size());
    }

    @Test
    public void testImportMissingRequiredColumns() {
        String csvContent = "name,code,price,quantity,status\n" +
                "Paracetamol,N02BE,1.50,150,In Stock"; // missing expiryDate

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        ItemImportResult result = itemService.importFromCsv(file);

        assertEquals(0, result.getTotalRecords());
        assertEquals(0, result.getImported());
        assertTrue(result.getErrors().get(0).contains("Missing required columns"));
    }

    @Test
    public void testImportInvalidNumericFields() {
        String csvContent = "name,code,category,description,manufacturer,price,sellingPrice,quantity,expiryDate,status\n" +
                "Paracetamol,N02BE,Analgesic,Pain,Global Meds,abc,3.00,150,2027-08-20,In Stock\n" +
                "Diclofenac,M01AB,Analgesic,Diclofenac,Test Pharma,8.50,12.00,-50,2026-10-10,In Stock";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        ItemImportResult result = itemService.importFromCsv(file);

        assertEquals(2, result.getTotalRecords());
        assertEquals(0, result.getImported());
        assertEquals(2, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("is not a valid number"));
        assertTrue(result.getErrors().get(1).contains("Quantity must be non-negative"));
    }

    @Test
    public void testImportInvalidDate() {
        String csvContent = "name,code,category,description,manufacturer,price,sellingPrice,quantity,expiryDate,status\n" +
                "Paracetamol,N02BE,Analgesic,Pain,Global Meds,1.50,3.00,150,2027/08/20,In Stock"; // invalid date format (needs YYYY-MM-DD or M/d/yyyy)

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        ItemImportResult result = itemService.importFromCsv(file);

        assertEquals(1, result.getTotalRecords());
        assertEquals(0, result.getImported());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("Expiry date"));
    }

    @Test
    public void testImportDuplicateCodeUpserts() {
        String csvContent = "name,code,category,description,manufacturer,price,sellingPrice,quantity,expiryDate,status\n" +
                "Paracetamol,N02BE,Analgesic,Pain,Global Meds,1.50,3.00,150,2027-08-20,In Stock";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        Item existingItem = new Item();
        existingItem.setId("1");
        existingItem.setCode("N02BE");

        Mockito.when(itemRepository.findByCodeIgnoreCase("N02BE")).thenReturn(Optional.of(existingItem));
        Mockito.when(itemRepository.save(any(Item.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ItemImportResult result = itemService.importFromCsv(file);

        assertEquals(1, result.getTotalRecords());
        assertEquals(0, result.getImported());
        assertEquals(1, result.getUpdated());
        assertEquals(0, result.getErrors().size());
    }
}
