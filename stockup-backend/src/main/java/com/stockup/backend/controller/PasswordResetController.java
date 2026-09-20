package com.stockup.backend.controller;

import com.stockup.backend.dto.PasswordResetCompleteDTO;
import com.stockup.backend.dto.PasswordResetRequestDTO;
import com.stockup.backend.dto.PasswordResetResponseDTO;
import com.stockup.backend.dto.PasswordResetVerifyDTO;
import com.stockup.backend.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/password-reset")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @Autowired
    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/request")
    public ResponseEntity<PasswordResetResponseDTO> requestReset(
            @Valid @RequestBody PasswordResetRequestDTO dto,
            HttpServletRequest request) {
        String clientIp = getClientIp(request);
        PasswordResetResponseDTO response = passwordResetService.requestPasswordReset(dto, clientIp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend")
    public ResponseEntity<PasswordResetResponseDTO> resendOtp(
            @RequestBody Map<String, String> payload,
            HttpServletRequest request) {
        String resetRequestId = payload != null ? payload.get("resetRequestId") : null;
        if (resetRequestId == null || resetRequestId.isBlank()) {
            return ResponseEntity.badRequest().body(PasswordResetResponseDTO.builder()
                    .success(false)
                    .message("Reset request ID is required")
                    .build());
        }

        String clientIp = getClientIp(request);
        PasswordResetResponseDTO response = passwordResetService.resendOtp(resetRequestId, clientIp);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<PasswordResetResponseDTO> verifyOtp(
            @Valid @RequestBody PasswordResetVerifyDTO dto) {
        PasswordResetResponseDTO response = passwordResetService.verifyOtp(dto);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/complete")
    public ResponseEntity<PasswordResetResponseDTO> completeReset(
            @Valid @RequestBody PasswordResetCompleteDTO dto) {
        PasswordResetResponseDTO response = passwordResetService.completePasswordReset(dto);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cancel")
    public ResponseEntity<PasswordResetResponseDTO> cancelReset(
            @RequestBody(required = false) Map<String, String> payload) {
        String resetRequestId = payload != null ? payload.get("resetRequestId") : null;
        String resetToken = payload != null ? payload.get("resetToken") : null;
        PasswordResetResponseDTO response = passwordResetService.cancelPasswordReset(resetRequestId, resetToken);
        return ResponseEntity.ok(response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
