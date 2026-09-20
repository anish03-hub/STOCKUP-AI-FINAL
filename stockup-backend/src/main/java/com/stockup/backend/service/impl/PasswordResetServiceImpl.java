package com.stockup.backend.service.impl;

import com.stockup.backend.dto.PasswordResetCompleteDTO;
import com.stockup.backend.dto.PasswordResetRequestDTO;
import com.stockup.backend.dto.PasswordResetResponseDTO;
import com.stockup.backend.dto.PasswordResetVerifyDTO;
import com.stockup.backend.model.PasswordResetToken;
import com.stockup.backend.model.User;
import com.stockup.backend.repository.PasswordResetTokenRepository;
import com.stockup.backend.repository.UserRepository;
import com.stockup.backend.service.EmailNotificationService;
import com.stockup.backend.service.PasswordResetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final String GENERIC_RESPONSE_MESSAGE = 
            "If an account matches the information provided, a verification code has been sent to your registered contact method.";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailNotificationService emailNotificationService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    public PasswordResetServiceImpl(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            EmailNotificationService emailNotificationService,
            @Lazy PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailNotificationService = emailNotificationService;
        this.passwordEncoder = passwordEncoder;
    }

    private String hashValue(String value) {
        if (value == null) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }

    private String maskIdentifier(String identifier) {
        if (identifier == null) return "null";
        int atIdx = identifier.indexOf('@');
        if (atIdx > 1) {
            return identifier.substring(0, 1) + "***" + identifier.substring(atIdx);
        }
        return identifier.length() > 4 ? identifier.substring(0, 2) + "***" : "***";
    }

    @Override
    @Transactional
    public PasswordResetResponseDTO requestPasswordReset(PasswordResetRequestDTO request, String ipAddress) {
        String identifier = request.getIdentifier().trim().toLowerCase();

        // Server-side rate limiting: Max 5 password reset requests per hour per identifier/IP
        long countRecent = tokenRepository.countByIdentifierSince(identifier, LocalDateTime.now().minusHours(1));
        if (countRecent >= 5) {
            log.warn("PASSWORD_RESET_RATE_LIMITED: Identifier='{}' exceeded hourly request limit", maskIdentifier(identifier));
            return PasswordResetResponseDTO.builder()
                    .success(true)
                    .message(GENERIC_RESPONSE_MESSAGE)
                    .build();
        }

        Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) {
            log.info("PASSWORD_RESET_NOT_FOUND: No registered user for identifier='{}'", maskIdentifier(identifier));
            return PasswordResetResponseDTO.builder()
                    .success(true)
                    .message(GENERIC_RESPONSE_MESSAGE)
                    .build();
        }

        User user = userOpt.get();

        // Check if account uses GOOGLE sign-in exclusively without local password
        boolean isGoogleOnly = "GOOGLE".equalsIgnoreCase(user.getAuthProvider()) 
                && (user.getPassword() == null || user.getPassword().isBlank());

        if (isGoogleOnly) {
            log.info("PASSWORD_RESET_GOOGLE_ONLY: Identifier='{}' is a Google-only account", maskIdentifier(identifier));
            return PasswordResetResponseDTO.builder()
                    .success(true)
                    .isGoogleOnly(true)
                    .message("This account uses Google Sign-In. You can continue with Google from the login page.")
                    .build();
        }

        // Generate cryptographically secure 6-digit OTP
        int otpNumber = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(otpNumber);
        String otpHash = hashValue(otp);

        // Invalidate previous unused reset requests for this identifier
        List<PasswordResetToken> existingTokens = tokenRepository.findByIdentifierAndUsedFalse(identifier);
        for (PasswordResetToken token : existingTokens) {
            token.setUsed(true);
            tokenRepository.save(token);
        }

        // Create new reset request token record
        String resetRequestId = UUID.randomUUID().toString();
        PasswordResetToken token = PasswordResetToken.builder()
                .id(resetRequestId)
                .userId(user.getId())
                .identifier(identifier)
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .attempts(0)
                .verified(false)
                .used(false)
                .ipAddress(ipAddress)
                .createdAt(LocalDateTime.now())
                .build();

        tokenRepository.save(token);
        log.info("PASSWORD_RESET_REQUESTED: Masked identifier='{}', resetRequestId='{}'", maskIdentifier(identifier), resetRequestId);

        // Send OTP Email
        boolean emailSent = emailNotificationService.sendPasswordResetOtp(user.getEmail(), otp);
        if (!emailSent) {
            token.setUsed(true);
            tokenRepository.save(token);
            return PasswordResetResponseDTO.builder()
                    .success(true)
                    .message(GENERIC_RESPONSE_MESSAGE)
                    .build();
        }

        return PasswordResetResponseDTO.builder()
                .success(true)
                .resetRequestId(resetRequestId)
                .contactType("EMAIL")
                .message("If an account matches the information provided, a verification code has been sent to your registered email.")
                .build();
    }

    @Override
    @Transactional
    public PasswordResetResponseDTO resendOtp(String resetRequestId, String ipAddress) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findById(resetRequestId);
        if (tokenOpt.isEmpty() || tokenOpt.get().isUsed()) {
            return PasswordResetResponseDTO.builder()
                    .success(false)
                    .message("Your password reset session has expired or is invalid. Please start again.")
                    .build();
        }

        PasswordResetToken token = tokenOpt.get();

        // Enforce 60-second resend cooldown
        if (token.getCreatedAt() != null && LocalDateTime.now().isBefore(token.getCreatedAt().plusSeconds(60))) {
            long remainingSec = 60 - java.time.Duration.between(token.getCreatedAt(), LocalDateTime.now()).getSeconds();
            return PasswordResetResponseDTO.builder()
                    .success(false)
                    .message("Please wait " + Math.max(1, remainingSec) + " seconds before requesting a new code.")
                    .build();
        }

        // Generate new 6-digit OTP
        int otpNumber = 100000 + secureRandom.nextInt(900000);
        String newOtp = String.valueOf(otpNumber);

        token.setOtpHash(hashValue(newOtp));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        token.setAttempts(0);
        token.setCreatedAt(LocalDateTime.now());
        tokenRepository.save(token);

        Optional<User> userOpt = userRepository.findByEmail(token.getIdentifier());
        if (userOpt.isPresent()) {
            emailNotificationService.sendPasswordResetOtp(userOpt.get().getEmail(), newOtp);
        }

        log.info("PASSWORD_RESET_OTP_RESENT: Resent OTP for resetRequestId='{}'", resetRequestId);
        return PasswordResetResponseDTO.builder()
                .success(true)
                .resetRequestId(resetRequestId)
                .message("A new verification code has been sent to your registered email.")
                .build();
    }

    @Override
    @Transactional
    public PasswordResetResponseDTO verifyOtp(PasswordResetVerifyDTO request) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findById(request.getResetRequestId());
        if (tokenOpt.isEmpty() || tokenOpt.get().isUsed()) {
            return PasswordResetResponseDTO.builder()
                    .success(false)
                    .message("Your password reset session has expired or is invalid. Please start again.")
                    .build();
        }

        PasswordResetToken token = tokenOpt.get();

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            return PasswordResetResponseDTO.builder()
                    .success(false)
                    .message("That verification code has expired. Please request a new code.")
                    .build();
        }

        if (token.getAttempts() >= 5) {
            token.setUsed(true);
            tokenRepository.save(token);
            return PasswordResetResponseDTO.builder()
                    .success(false)
                    .message("Too many incorrect verification attempts. Please request a new code.")
                    .build();
        }

        // Increment attempts
        token.setAttempts(token.getAttempts() + 1);

        String suppliedHash = hashValue(request.getOtp().trim());
        if (!suppliedHash.equals(token.getOtpHash())) {
            log.warn("PASSWORD_RESET_OTP_FAILED: Invalid OTP attempt {}/5 for requestId='{}'", token.getAttempts(), token.getId());
            
            if (token.getAttempts() >= 5) {
                token.setUsed(true);
                tokenRepository.save(token);
                return PasswordResetResponseDTO.builder()
                        .success(false)
                        .message("Too many incorrect verification attempts. Please request a new code.")
                        .build();
            }

            tokenRepository.save(token);
            return PasswordResetResponseDTO.builder()
                    .success(false)
                    .message("That verification code is incorrect. Please try again.")
                    .build();
        }

        // OTP Verified successfully! Generate short-lived reset authorization token (15 mins)
        String rawResetToken = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
        token.setVerified(true);
        token.setVerifiedAt(LocalDateTime.now());
        token.setResetTokenHash(hashValue(rawResetToken));
        token.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(15));
        tokenRepository.save(token);

        log.info("PASSWORD_RESET_OTP_VERIFIED: OTP verified for resetRequestId='{}'", token.getId());

        return PasswordResetResponseDTO.builder()
                .success(true)
                .resetToken(rawResetToken)
                .message("Verification successful. Your identity has been verified.")
                .build();
    }

    @Override
    @Transactional
    public PasswordResetResponseDTO completePasswordReset(PasswordResetCompleteDTO request) {
        String tokenHash = hashValue(request.getResetToken().trim());
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByResetTokenHash(tokenHash);

        if (tokenOpt.isEmpty() || !tokenOpt.get().isVerified() || tokenOpt.get().isUsed()) {
            return PasswordResetResponseDTO.builder()
                    .success(false)
                    .message("Your password reset session has expired or is invalid. Please start again.")
                    .build();
        }

        PasswordResetToken token = tokenOpt.get();

        if (token.getResetTokenExpiresAt() == null || token.getResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            return PasswordResetResponseDTO.builder()
                    .success(false)
                    .message("Your password reset session has expired. Please start again.")
                    .build();
        }

        String newPassword = request.getNewPassword();
        if (newPassword == null || newPassword.length() < 8) {
            return PasswordResetResponseDTO.builder()
                    .success(false)
                    .message("Password must be at least 8 characters long.")
                    .build();
        }

        Optional<User> userOpt = userRepository.findById(token.getUserId());
        if (userOpt.isEmpty()) {
            return PasswordResetResponseDTO.builder()
                    .success(false)
                    .message("User account not found.")
                    .build();
        }

        User user = userOpt.get();

        // Check if new password matches existing password
        if (user.getPassword() != null && passwordEncoder.matches(newPassword, user.getPassword())) {
            return PasswordResetResponseDTO.builder()
                    .success(false)
                    .message("New password cannot be identical to your current password.")
                    .build();
        }

        // Update user password hash
        user.setPassword(passwordEncoder.encode(newPassword));
        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider())) {
            user.setAuthProvider("BOTH");
        }
        userRepository.save(user);

        // Mark reset request as used
        token.setUsed(true);
        token.setUsedAt(LocalDateTime.now());
        tokenRepository.save(token);

        log.info("PASSWORD_RESET_COMPLETED: Password reset completed for userId='{}'", user.getId());

        return PasswordResetResponseDTO.builder()
                .success(true)
                .message("Your password has been reset successfully. You can now log in using your new password.")
                .build();
    }

    @Override
    @Transactional
    public PasswordResetResponseDTO cancelPasswordReset(String resetRequestId, String resetToken) {
        if (resetRequestId != null && !resetRequestId.isBlank()) {
            Optional<PasswordResetToken> tokenOpt = tokenRepository.findById(resetRequestId.trim());
            if (tokenOpt.isPresent()) {
                PasswordResetToken token = tokenOpt.get();
                token.setUsed(true);
                tokenRepository.save(token);
                log.info("PASSWORD_RESET_CANCELLED: Recovery session cancelled for resetRequestId='{}'", resetRequestId);
            }
        }
        if (resetToken != null && !resetToken.isBlank()) {
            String tokenHash = hashValue(resetToken.trim());
            Optional<PasswordResetToken> tokenOpt = tokenRepository.findByResetTokenHash(tokenHash);
            if (tokenOpt.isPresent()) {
                PasswordResetToken token = tokenOpt.get();
                token.setUsed(true);
                tokenRepository.save(token);
                log.info("PASSWORD_RESET_CANCELLED: Recovery session cancelled for resetToken");
            }
        }
        return PasswordResetResponseDTO.builder()
                .success(true)
                .message("Password reset session cancelled successfully.")
                .build();
    }
}
