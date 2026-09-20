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
public class DocumentUploadResponseDTO {
    private String documentId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String status;
    private LocalDateTime uploadedAt;
    private String message;
}
