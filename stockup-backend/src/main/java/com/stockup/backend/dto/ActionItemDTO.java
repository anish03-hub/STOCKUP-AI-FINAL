package com.stockup.backend.dto;

public class ActionItemDTO {
    private String type; // e.g., "URGENT", "WARNING", "INFO"
    private String message;
    private String link; // e.g., "/expiry" or "/reorder"

    public ActionItemDTO() {}

    public ActionItemDTO(String type, String message, String link) {
        this.type = type;
        this.message = message;
        this.link = link;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getPriority() { return type; }
    public void setPriority(String priority) { this.type = priority; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }
    public String getSuggestedActionRoute() { return link; }
    public void setSuggestedActionRoute(String route) { this.link = route; }
}
