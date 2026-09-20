package com.stockup.backend.service;

import com.stockup.backend.repository.ExpiryNotificationLogRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailNotificationServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private ExpiryNotificationLogRepository logRepository;

    private EmailNotificationService emailNotificationService;

    @BeforeEach
    void setUp() {
        emailNotificationService = new EmailNotificationService(mailSender, logRepository);
    }

    @Test
    @DisplayName("sendPasswordResetOtp creates MimeMessage with subject, recipient, and OTP body")
    void testSendPasswordResetOtp_Success() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        boolean result = emailNotificationService.sendPasswordResetOtp("ag584160@gmail.com", "482731");

        assertTrue(result);
        verify(mailSender, times(1)).send(mimeMessage);

        assertEquals("StockUp AI — Password Reset Verification Code", mimeMessage.getSubject());
        assertNotNull(mimeMessage.getAllRecipients());
        assertEquals(1, mimeMessage.getAllRecipients().length);
        assertEquals("ag584160@gmail.com", mimeMessage.getAllRecipients()[0].toString());
    }

    @Test
    @DisplayName("sendPasswordResetOtp handles mailSender exception gracefully")
    void testSendPasswordResetOtp_Failure() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("SMTP Connection Refused")).when(mailSender).send(any(MimeMessage.class));

        boolean result = emailNotificationService.sendPasswordResetOtp("ag584160@gmail.com", "482731");

        assertFalse(result);
    }
}
