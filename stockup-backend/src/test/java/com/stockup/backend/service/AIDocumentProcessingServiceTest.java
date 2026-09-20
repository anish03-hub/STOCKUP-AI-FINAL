package com.stockup.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockup.backend.dto.document.*;
import com.stockup.backend.model.*;
import com.stockup.backend.repository.*;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.service.impl.AIDocumentProcessingServiceImpl;
import com.stockup.backend.service.impl.DocumentParserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AIDocumentProcessingServiceTest {

    @Mock
    private DocumentProcessingRepository documentRepository;
    @Mock
    private DocumentAuditLogRepository auditLogRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;
    @Mock
    private SaleTransactionRepository saleTransactionRepository;
    @Mock
    private CurrentUserService currentUserService;

    private DocumentParserService documentParserService;
    private ObjectMapper objectMapper;
    private AIDocumentProcessingServiceImpl processingService;

    private final String TENANT_A = "tenant-medicare-1";
    private final String TENANT_B = "tenant-apollo-2";

    @BeforeEach
    void setUp() {
        documentParserService = new DocumentParserServiceImpl();
        objectMapper = new ObjectMapper();
        processingService = new AIDocumentProcessingServiceImpl(
                documentRepository,
                auditLogRepository,
                itemRepository,
                supplierRepository,
                purchaseOrderRepository,
                saleTransactionRepository,
                documentParserService,
                currentUserService,
                objectMapper
        );
    }

    @Test
    void testUploadValidCsv() {
        when(currentUserService.getCurrentUserBusinessId()).thenReturn(TENANT_A);
        when(currentUserService.getCurrentUserEmail()).thenReturn("admin@medicare.com");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "medicines.csv",
                "text/csv",
                "Medicine Name,Quantity,Unit Price\nParacetamol,100,2.50".getBytes(StandardCharsets.UTF_8)
        );

        when(documentRepository.save(any(DocumentProcessing.class))).thenAnswer(i -> {
            DocumentProcessing d = i.getArgument(0);
            if (d.getId() == null) d.setId(UUID.randomUUID().toString());
            return d;
        });

        DocumentUploadResponseDTO response = processingService.uploadDocument(file);

        assertNotNull(response);
        assertNotNull(response.getDocumentId());
        assertEquals("medicines.csv", response.getFileName());
        assertEquals("CSV", response.getFileType());
        assertEquals("UPLOADED", response.getStatus());
    }

    @Test
    void testRejectUnsupportedFileType() {
        when(currentUserService.getCurrentUserBusinessId()).thenReturn(TENANT_A);
        when(currentUserService.getCurrentUserEmail()).thenReturn("admin@medicare.com");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "dangerous.exe",
                "application/octet-stream",
                "binary content".getBytes(StandardCharsets.UTF_8)
        );

        assertThrows(IllegalArgumentException.class, () -> processingService.uploadDocument(file));
    }

    @Test
    void testMultiTenantIsolation() {
        when(currentUserService.getCurrentUserBusinessId()).thenReturn(TENANT_B);

        when(documentRepository.findByIdAndBusinessId("doc-123", TENANT_B)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> processingService.getDocumentDetails("doc-123"));
    }
}
