package com.stockup.backend.service;

import com.stockup.backend.dto.PasswordResetCompleteDTO;
import com.stockup.backend.dto.PasswordResetRequestDTO;
import com.stockup.backend.dto.PasswordResetResponseDTO;
import com.stockup.backend.dto.PasswordResetVerifyDTO;
import com.stockup.backend.model.PasswordResetToken;
import com.stockup.backend.model.User;
import com.stockup.backend.repository.PasswordResetTokenRepository;
import com.stockup.backend.repository.UserRepository;
import com.stockup.backend.service.impl.PasswordResetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private EmailNotificationService emailNotificationService;

    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private PasswordResetServiceImpl passwordResetService;

    private User sampleUser;

    private String hashValue(String value) {
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
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @BeforeEach
    void setUp() {
        passwordResetService = new PasswordResetServiceImpl(
                userRepository, tokenRepository, emailNotificationService, passwordEncoder);

        sampleUser = new User();
        sampleUser.setId("user-123");
        sampleUser.setEmail("ag584160@gmail.com");
        sampleUser.setFullName("Anish Sah");
        sampleUser.setPassword(passwordEncoder.encode("Password123!"));
        sampleUser.setAuthProvider("BOTH");
        sampleUser.setBusinessId("business-789");
        sampleUser.setRole("ADMIN");
                                
    }

    @Test
    @DisplayName("1 & 3 & 4 & 5. Existing email requests reset -> generates hashed OTP & sends email")
    void testRequestPasswordReset_Success() {
        PasswordResetRequestDTO dto = new PasswordResetRequestDTO("ag584160@gmail.com");
        when(tokenRepository.countByIdentifierSince(any(), any())).thenReturn(0L);
        when(userRepository.findByEmail("ag584160@gmail.com")).thenReturn(Optional.of(sampleUser));
        when(emailNotificationService.sendPasswordResetOtp(eq("ag584160@gmail.com"), any())).thenReturn(true);

        PasswordResetResponseDTO response = passwordResetService.requestPasswordReset(dto, "127.0.0.1");

        assertTrue(response.isSuccess());
        assertNotNull(response.getResetRequestId());
        assertTrue(response.getMessage().contains("If an account matches"));

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(tokenCaptor.capture());

        PasswordResetToken savedToken = tokenCaptor.getValue();
        assertNotNull(savedToken.getOtpHash());
        assertNotEquals("123456", savedToken.getOtpHash(), "OTP must not be saved in plaintext!");
        assertEquals("user-123", savedToken.getUserId());
        assertFalse(savedToken.isVerified());

        verify(emailNotificationService).sendPasswordResetOtp(eq("ag584160@gmail.com"), any());
    }

    @Test
    @DisplayName("2. Unknown email returns generic response without exposing account absence")
    void testRequestPasswordReset_UnknownEmail() {
        PasswordResetRequestDTO dto = new PasswordResetRequestDTO("unknown@gmail.com");
        when(tokenRepository.countByIdentifierSince(any(), any())).thenReturn(0L);
        when(userRepository.findByEmail("unknown@gmail.com")).thenReturn(Optional.empty());

        PasswordResetResponseDTO response = passwordResetService.requestPasswordReset(dto, "127.0.0.1");

        assertTrue(response.isSuccess());
        assertNull(response.getResetRequestId());
        assertTrue(response.getMessage().contains("If an account matches"));
        verify(emailNotificationService, never()).sendPasswordResetOtp(any(), any());
    }

    @Test
    @DisplayName("6 & 7. Correct OTP verifies reset request")
    void testVerifyOtp_Success() {
        String rawOtp = "482731";
        String otpHash = hashValue(rawOtp);

        PasswordResetToken token = PasswordResetToken.builder()
                .id("req-100")
                .userId("user-123")
                .identifier("ag584160@gmail.com")
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .attempts(0)
                .verified(false)
                .used(false)
                .build();

        when(tokenRepository.findById("req-100")).thenReturn(Optional.of(token));

        PasswordResetVerifyDTO verifyDTO = new PasswordResetVerifyDTO("req-100", rawOtp);
        PasswordResetResponseDTO response = passwordResetService.verifyOtp(verifyDTO);

        assertTrue(response.isSuccess());
        assertNotNull(response.getResetToken());
        assertTrue(token.isVerified());
        assertNotNull(token.getResetTokenHash());
    }

    @Test
    @DisplayName("8. Incorrect OTP fails verification and increments attempts")
    void testVerifyOtp_IncorrectOtp() {
        String otpHash = hashValue("482731");

        PasswordResetToken token = PasswordResetToken.builder()
                .id("req-100")
                .userId("user-123")
                .identifier("ag584160@gmail.com")
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .attempts(0)
                .verified(false)
                .used(false)
                .build();

        when(tokenRepository.findById("req-100")).thenReturn(Optional.of(token));

        PasswordResetVerifyDTO verifyDTO = new PasswordResetVerifyDTO("req-100", "000000");
        PasswordResetResponseDTO response = passwordResetService.verifyOtp(verifyDTO);

        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("incorrect"));
        assertEquals(1, token.getAttempts());
        assertFalse(token.isVerified());
    }

    @Test
    @DisplayName("9. 5 failed attempts invalidates password reset request")
    void testVerifyOtp_MaxAttemptsExceeded() {
        String otpHash = hashValue("482731");

        PasswordResetToken token = PasswordResetToken.builder()
                .id("req-100")
                .userId("user-123")
                .identifier("ag584160@gmail.com")
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .attempts(4)
                .verified(false)
                .used(false)
                .build();

        when(tokenRepository.findById("req-100")).thenReturn(Optional.of(token));

        PasswordResetVerifyDTO verifyDTO = new PasswordResetVerifyDTO("req-100", "000000");
        PasswordResetResponseDTO response = passwordResetService.verifyOtp(verifyDTO);

        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Too many incorrect verification attempts"));
        assertEquals(5, token.getAttempts());
        assertTrue(token.isUsed());
    }

    @Test
    @DisplayName("6. Expired OTP fails verification")
    void testVerifyOtp_Expired() {
        String otpHash = hashValue("482731");

        PasswordResetToken token = PasswordResetToken.builder()
                .id("req-100")
                .userId("user-123")
                .identifier("ag584160@gmail.com")
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .attempts(0)
                .verified(false)
                .used(false)
                .build();

        when(tokenRepository.findById("req-100")).thenReturn(Optional.of(token));

        PasswordResetVerifyDTO verifyDTO = new PasswordResetVerifyDTO("req-100", "482731");
        PasswordResetResponseDTO response = passwordResetService.verifyOtp(verifyDTO);

        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("expired"));
    }

    @Test
    @DisplayName("12 & 16. Complete password reset updates user password hash and preserves businessId")
    void testCompletePasswordReset_Success() {
        String rawResetToken = "reset-token-xyz-123456789";
        String tokenHash = hashValue(rawResetToken);

        PasswordResetToken token = PasswordResetToken.builder()
                .id("req-100")
                .userId("user-123")
                .identifier("ag584160@gmail.com")
                .otpHash("otpHash")
                .verified(true)
                .used(false)
                .resetTokenHash(tokenHash)
                .resetTokenExpiresAt(LocalDateTime.now().plusMinutes(15))
                .build();

        when(tokenRepository.findByResetTokenHash(tokenHash)).thenReturn(Optional.of(token));
        when(userRepository.findById("user-123")).thenReturn(Optional.of(sampleUser));

        PasswordResetCompleteDTO completeDTO = new PasswordResetCompleteDTO(rawResetToken, "NewSecurePass123!");
        PasswordResetResponseDTO response = passwordResetService.completePasswordReset(completeDTO);

        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("reset successfully"));
        assertTrue(token.isUsed());
        assertEquals("business-789", sampleUser.getBusinessId(), "Business ID must remain intact!");

        assertTrue(passwordEncoder.matches("NewSecurePass123!", sampleUser.getPassword()),
                "New password must match BCrypt hash!");
    }
}
