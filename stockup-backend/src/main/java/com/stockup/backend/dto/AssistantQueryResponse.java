package com.stockup.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO from the StockUp internal AI assistant.
 * Contains the detected intent, a human-readable answer, and optional structured data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AssistantQueryResponse {

    private String intent;
    private String answer;
    private Object data;

    public AssistantQueryResponse(String intent, String answer) {
        this.intent = intent;
        this.answer = answer;
        this.data = null;
    }
}

