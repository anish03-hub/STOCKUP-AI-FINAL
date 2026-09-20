package com.stockup.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PasswordResetResponseDTO {
    private boolean success;
    private String message;
    private String resetRequestId;
    private String resetToken;
    private String contactType; // "EMAIL" or "PHONE"
    private Boolean isGoogleOnly;
}
