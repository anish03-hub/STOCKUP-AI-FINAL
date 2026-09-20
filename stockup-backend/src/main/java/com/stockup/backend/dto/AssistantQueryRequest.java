package com.stockup.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for the StockUp internal AI assistant.
 * The message is a natural-language question from the user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantQueryRequest {

    @NotBlank(message = "Message is required")
    @Size(max = 500, message = "Message must be 500 characters or less")
    private String message;
}

