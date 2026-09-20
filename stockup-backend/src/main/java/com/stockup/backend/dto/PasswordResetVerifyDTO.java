package com.stockup.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetVerifyDTO {
    @NotBlank(message = "Reset request ID is required")
    private String resetRequestId;

    @NotBlank(message = "OTP verification code is required")
    private String otp;
}
