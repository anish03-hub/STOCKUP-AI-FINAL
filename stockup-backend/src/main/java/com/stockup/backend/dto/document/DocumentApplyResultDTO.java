package com.stockup.backend.dto.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentApplyResultDTO {
    private String documentId;
    private String fileName;
    private String documentType;
    private String status; // APPLIED, FAILED, PARTIAL
    private Integer recordsProcessed;
    private Integer recordsCreated;
    private Integer recordsUpdated;
    private Integer recordsFailed;
    private Double grandTotal;
    private String currency;
    private String summaryMessage;
    private String auditLogId;
    private List<String> errorDetails;
    private LocalDateTime appliedAt;
}
