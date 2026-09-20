package com.stockup.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiryCheckResult {
    private boolean success;
    private String status; // SENT, FAILED, SIMULATED
    private String recipient;
    private String businessId;
    private String businessName;
    private int processedItems;
    private int criticalItems;
    private int warningItems;
    private String errorMessage;
}
