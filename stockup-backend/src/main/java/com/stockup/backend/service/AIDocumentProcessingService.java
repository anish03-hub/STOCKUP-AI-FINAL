package com.stockup.backend.service;

import com.stockup.backend.dto.document.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AIDocumentProcessingService {

    /**
     * Store and register an uploaded pharmacy document for the authenticated business.
     */
    DocumentUploadResponseDTO uploadDocument(MultipartFile file);

    /**
     * Parse, classify, extract items, match medicines, and prepare an inventory impact preview.
     */
    DocumentAnalysisResponseDTO analyzeDocument(String documentId, String overrideDocumentType);

    /**
     * Atomically apply the validated document changes to the tenant's database using existing service layers.
     */
    DocumentApplyResultDTO applyDocument(String documentId, DocumentApplyRequestDTO request);

    /**
     * Retrieve all uploaded documents for the authenticated business.
     */
    List<DocumentSummaryDTO> getDocumentHistory();

    /**
     * Retrieve full details / analysis preview of a document.
     */
    DocumentAnalysisResponseDTO getDocumentDetails(String documentId);

    /**
     * Delete or cancel an uploaded document.
     */
    void deleteDocument(String documentId);
}
