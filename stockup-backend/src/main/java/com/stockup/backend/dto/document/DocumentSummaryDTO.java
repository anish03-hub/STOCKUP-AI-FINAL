package com.stockup.backend.dto.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSummaryDTO {
    private String id;
    private String fileName;
    private String fileType;
    private String documentType;
    private String status;
    private Integer itemsDetected;
    private Double grandTotal;
    private String currency;
    private String uploadedBy;
    private LocalDateTime createdAt;
    private LocalDateTime appliedAt;
}
