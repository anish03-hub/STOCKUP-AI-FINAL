package com.stockup.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for the StockUp internal AI assistant.
 * The message is a natural-language question from the user.
 */
public class AssistantQueryRequest {

    @NotBlank(message = "Message is required")
    @Size(max = 500, message = "Message must be 500 characters or less")
    private String message;

    public AssistantQueryRequest() {
    }

    public AssistantQueryRequest(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
