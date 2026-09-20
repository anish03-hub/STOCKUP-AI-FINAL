package com.stockup.backend.controller;

import com.stockup.backend.dto.AssistantQueryRequest;
import com.stockup.backend.dto.AssistantQueryResponse;
import com.stockup.backend.service.AssistantService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for the StockUp internal AI Data Assistant.
 *
 * Endpoint:
 *   POST /api/assistant/query
 *
 * Authentication:
 *   Requires valid JWT (same as all other /api/* endpoints).
 *
 * All responses are computed from StockUp internal services and PostgreSQL.
 */
@RestController
@RequestMapping("/api/assistant")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AssistantController {

    private final AssistantService assistantService;

    @Autowired
    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    /**
     * Process a natural-language query from the authenticated user.
     *
     * @param request AssistantQueryRequest containing the user's message
     * @return AssistantQueryResponse with intent, human-readable answer, and structured data
     */
    @PostMapping("/query")
    public ResponseEntity<AssistantQueryResponse> query(@Valid @RequestBody AssistantQueryRequest request) {
        AssistantQueryResponse response = assistantService.processQuery(request.getMessage());
        return ResponseEntity.ok(response);
    }
}
