package com.stockup.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO from the StockUp internal AI assistant.
 * Contains the detected intent, a human-readable answer, and optional structured data.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AssistantQueryResponse {

    private String intent;
    private String answer;
    private Object data;

    public AssistantQueryResponse() {
    }

    public AssistantQueryResponse(String intent, String answer) {
        this.intent = intent;
        this.answer = answer;
        this.data = null;
    }

    public AssistantQueryResponse(String intent, String answer, Object data) {
        this.intent = intent;
        this.answer = answer;
        this.data = data;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}
