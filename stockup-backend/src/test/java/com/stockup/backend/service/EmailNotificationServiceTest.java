package com.stockup.backend.service;

import com.stockup.backend.repository.ExpiryNotificationLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailNotificationServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private ExpiryNotificationLogRepository logRepository;

    @Mock
    private RestTemplate restTemplate;

    private EmailNotificationService emailNotificationService;

    @BeforeEach
    void setUp() {
        emailNotificationService = new EmailNotificationService(mailSender, logRepository, restTemplate);
        emailNotificationService.setResendConfig(
                "https://api.resend.com/emails",
                "re_test_key_12345",
                "onboarding@resend.dev"
        );
    }

    @Test
    @DisplayName("sendPasswordResetOtp dispatches HTTPS request to Resend API and returns true on success")
    @SuppressWarnings("unchecked")
    void testSendPasswordResetOtp_Resend_Success() {
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(Map.of("id", "resend_msg_abc123"), HttpStatus.OK));

        boolean result = emailNotificationService.sendPasswordResetOtp("recipient@gmail.com", "482731");

        assertTrue(result, "sendPasswordResetOtp should return true when Resend accepts the message");

        ArgumentCaptor<HttpEntity<Map<String, Object>>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(1)).postForEntity(eq("https://api.resend.com/emails"), captor.capture(), eq(Map.class));

        HttpEntity<Map<String, Object>> entity = captor.getValue();
        assertNotNull(entity);

        // Verify Bearer Auth Header and Content-Type
        assertEquals("Bearer re_test_key_12345", entity.getHeaders().getFirst(HttpHeaders.AUTHORIZATION));
        assertEquals(MediaType.APPLICATION_JSON, entity.getHeaders().getContentType());

        // Verify Payload
        Map<String, Object> body = entity.getBody();
        assertNotNull(body);
        assertEquals("StockUp AI <onboarding@resend.dev>", body.get("from"));
        assertEquals(List.of("recipient@gmail.com"), body.get("to"));
        assertEquals("StockUp AI — Password Reset Verification Code", body.get("subject"));
        assertTrue(body.get("html").toString().contains("482731"), "HTML body must contain the OTP");
    }

    @Test
    @DisplayName("sendPasswordResetOtp returns false promptly when Resend API key is missing or blank")
    void testSendPasswordResetOtp_MissingApiKey_ReturnsFalse() {
        emailNotificationService.setResendConfig("https://api.resend.com/emails", "", "onboarding@resend.dev");

        boolean result = emailNotificationService.sendPasswordResetOtp("recipient@gmail.com", "482731");

        assertFalse(result, "Must return false when RESEND_API_KEY is empty");
        verify(restTemplate, never()).postForEntity(anyString(), any(), any());
    }

    @Test
    @DisplayName("sendPasswordResetOtp returns false when Resend API key is null")
    void testSendPasswordResetOtp_NullApiKey_ReturnsFalse() {
        emailNotificationService.setResendConfig("https://api.resend.com/emails", null, "onboarding@resend.dev");

        boolean result = emailNotificationService.sendPasswordResetOtp("recipient@gmail.com", "482731");

        assertFalse(result, "Must return false when RESEND_API_KEY is null");
        verify(restTemplate, never()).postForEntity(anyString(), any(), any());
    }

    @Test
    @DisplayName("sendPasswordResetOtp returns false for null or blank recipient email without making HTTP calls")
    void testSendPasswordResetOtp_BlankOrNullEmail() {
        assertFalse(emailNotificationService.sendPasswordResetOtp(null, "123456"));
        assertFalse(emailNotificationService.sendPasswordResetOtp("   ", "123456"));
        verify(restTemplate, never()).postForEntity(anyString(), any(), any());
    }

    @Test
    @DisplayName("sendPasswordResetOtp handles 403 Forbidden (e.g. testing domain restricted recipient) safely")
    @SuppressWarnings("unchecked")
    void testSendPasswordResetOtp_Resend_ApiError403_Forbidden() {
        String errorJson = "{\"statusCode\":403,\"message\":\"You can only send to your own email address while using the testing domain onboarding@resend.dev.\"}";
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.FORBIDDEN,
                        "Forbidden",
                        HttpHeaders.EMPTY,
                        errorJson.getBytes(StandardCharsets.UTF_8),
                        StandardCharsets.UTF_8
                ));

        boolean result = emailNotificationService.sendPasswordResetOtp("unverified@example.com", "482731");

        assertFalse(result, "Must return false when Resend rejects unpermitted test recipient");
    }

    @Test
    @DisplayName("sendPasswordResetOtp handles 500 Internal Server Error from Resend safely")
    @SuppressWarnings("unchecked")
    void testSendPasswordResetOtp_Resend_ApiError500_ServerError() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR));

        boolean result = emailNotificationService.sendPasswordResetOtp("recipient@gmail.com", "482731");

        assertFalse(result, "Must return false on Resend server error");
    }

    @Test
    @DisplayName("sendPasswordResetOtp handles network or connection timeouts gracefully")
    @SuppressWarnings("unchecked")
    void testSendPasswordResetOtp_Resend_Timeout() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new ResourceAccessException("Connect timed out after 5000ms"));

        boolean result = emailNotificationService.sendPasswordResetOtp("recipient@gmail.com", "482731");

        assertFalse(result, "Must return false on network connection/read timeout");
    }

    @Test
    @DisplayName("sendPasswordResetOtp returns false when Resend response is missing an id")
    @SuppressWarnings("unchecked")
    void testSendPasswordResetOtp_Resend_MalformedResponse_MissingId() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(Map.of("status", "accepted"), HttpStatus.OK));

        boolean result = emailNotificationService.sendPasswordResetOtp("recipient@gmail.com", "482731");

        assertFalse(result, "Must return false when Resend body does not contain an id");
    }

    @Test
    @DisplayName("sendPasswordResetOtp returns false when Resend response body is null")
    @SuppressWarnings("unchecked")
    void testSendPasswordResetOtp_Resend_NullResponseBody() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

        boolean result = emailNotificationService.sendPasswordResetOtp("recipient@gmail.com", "482731");

        assertFalse(result, "Must return false when Resend body is null");
    }

    @Test
    @DisplayName("sendPasswordResetOtp formats from address correctly when angle brackets are already provided")
    @SuppressWarnings("unchecked")
    void testSendPasswordResetOtp_FromAddressWithDisplayName() {
        emailNotificationService.setResendConfig(
                "https://api.resend.com/emails",
                "re_test_key_12345",
                "StockUp Alerts <custom@resend.dev>"
        );
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(Map.of("id", "msg_123"), HttpStatus.OK));

        boolean result = emailNotificationService.sendPasswordResetOtp("recipient@gmail.com", "482731");

        assertTrue(result);
        ArgumentCaptor<HttpEntity<Map<String, Object>>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(anyString(), captor.capture(), eq(Map.class));
        assertEquals("StockUp Alerts <custom@resend.dev>", captor.getValue().getBody().get("from"));
    }
}
