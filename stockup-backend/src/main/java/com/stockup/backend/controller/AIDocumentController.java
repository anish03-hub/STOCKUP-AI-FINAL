package com.stockup.backend.controller;

import com.stockup.backend.dto.document.*;
import com.stockup.backend.service.AIDocumentProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Controller for the Production Document Upload & AI Processing Pipeline.
 *
 * Endpoints:
 *   POST   /api/ai/documents/upload          - Upload PDF or CSV
 *   POST   /api/ai/documents/{id}/analyze     - AI Document Analysis & Preview
 *   POST   /api/ai/documents/{id}/apply       - Apply validated changes to database
 *   GET    /api/ai/documents                  - Document processing history
 *   GET    /api/ai/documents/{id}             - Document details
 *   DELETE /api/ai/documents/{id}             - Delete/Cancel document
 */
@Slf4j
@RestController
@RequestMapping("/api/ai/documents")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class AIDocumentController {

    private final AIDocumentProcessingService documentProcessingService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentUploadResponseDTO> uploadDocument(@RequestParam("file") MultipartFile file) {
        log.info("Received document upload request: filename={}, size={}", file.getOriginalFilename(), file.getSize());
        DocumentUploadResponseDTO response = documentProcessingService.uploadDocument(file);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{documentId}/analyze")
    public ResponseEntity<DocumentAnalysisResponseDTO> analyzeDocument(
            @PathVariable("documentId") String documentId,
            @RequestBody(required = false) Map<String, String> request) {
        String overrideType = request != null ? request.get("documentType") : null;
        log.info("Analyzing document: id={}, overrideType={}", documentId, overrideType);
        DocumentAnalysisResponseDTO response = documentProcessingService.analyzeDocument(documentId, overrideType);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{documentId}/apply")
    public ResponseEntity<DocumentApplyResultDTO> applyDocument(
            @PathVariable("documentId") String documentId,
            @RequestBody(required = false) DocumentApplyRequestDTO request) {
        log.info("Applying document changes: id={}", documentId);
        DocumentApplyResultDTO response = documentProcessingService.applyDocument(documentId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping({"", "/history"})
    public ResponseEntity<List<DocumentSummaryDTO>> getDocumentHistory() {
        List<DocumentSummaryDTO> history = documentProcessingService.getDocumentHistory();
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentAnalysisResponseDTO> getDocumentDetails(@PathVariable("documentId") String documentId) {
        DocumentAnalysisResponseDTO details = documentProcessingService.getDocumentDetails(documentId);
        return ResponseEntity.ok(details);
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Map<String, Object>> deleteDocument(@PathVariable("documentId") String documentId) {
        documentProcessingService.deleteDocument(documentId);
        return ResponseEntity.ok(Map.of("message", "Document deleted successfully", "documentId", documentId));
    }
}
