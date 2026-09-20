package com.stockup.backend.service;

import com.stockup.backend.dto.PasswordResetCompleteDTO;
import com.stockup.backend.dto.PasswordResetRequestDTO;
import com.stockup.backend.dto.PasswordResetResponseDTO;
import com.stockup.backend.dto.PasswordResetVerifyDTO;

public interface PasswordResetService {

    PasswordResetResponseDTO requestPasswordReset(PasswordResetRequestDTO request, String ipAddress);

    PasswordResetResponseDTO resendOtp(String resetRequestId, String ipAddress);

    PasswordResetResponseDTO verifyOtp(PasswordResetVerifyDTO request);

    PasswordResetResponseDTO completePasswordReset(PasswordResetCompleteDTO request);

    PasswordResetResponseDTO cancelPasswordReset(String resetRequestId, String resetToken);
}
