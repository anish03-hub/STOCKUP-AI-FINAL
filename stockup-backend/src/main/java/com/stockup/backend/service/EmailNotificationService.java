package com.stockup.backend.service;

import com.stockup.backend.dto.ExpiryCheckResult;
import com.stockup.backend.dto.ExpiryItemDetails;
import com.stockup.backend.model.ExpiryNotificationLog;
import com.stockup.backend.repository.ExpiryNotificationLogRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class EmailNotificationService {

    private final JavaMailSender mailSender;
    private final ExpiryNotificationLogRepository logRepository;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${mail.from:ag584160@gmail.com}")
    private String mailFrom;

    @Autowired
    public EmailNotificationService(
            @Autowired(required = false) JavaMailSender mailSender,
            ExpiryNotificationLogRepository logRepository) {
        this.mailSender = mailSender;
        this.logRepository = logRepository;
    }

    @jakarta.annotation.PostConstruct
    public void logSmtpDiagnostic() {
        boolean hasPassword = mailPassword != null && !mailPassword.trim().isEmpty();
        String activeUser = (mailUsername != null && !mailUsername.isBlank()) ? mailUsername : "ag584160@gmail.com";
        String fromAddress = (mailFrom != null && !mailFrom.isBlank()) ? mailFrom : activeUser;
        log.info("SMTP_CONFIG_DIAGNOSTIC: host='{}:{}', mailUsername='{}', mailFrom='{}', passwordConfigured={}",
                mailHost, mailPort, activeUser, fromAddress, hasPassword);
    }

    /**
     * Send a consolidated expiry alert email to the recipient for the given business.
     */
    @Transactional
    public ExpiryCheckResult sendConsolidatedExpiryAlert(
            String businessId,
            String businessName,
            String recipientEmail,
            List<ExpiryItemDetails> atRiskItems) {

        int criticalCount = (int) (atRiskItems != null ? atRiskItems.stream().filter(i -> "CRITICAL".equalsIgnoreCase(i.getRiskLevel())).count() : 0);
        int warningCount = (int) (atRiskItems != null ? atRiskItems.stream().filter(i -> "WARNING".equalsIgnoreCase(i.getRiskLevel())).count() : 0);
        int count = atRiskItems != null ? atRiskItems.size() : 0;

        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("EXPIRY_EMAIL_FAILED: Missing recipient email for business '{}' ({})", businessName, businessId);
            return ExpiryCheckResult.builder()
                    .success(false)
                    .status("FAILED")
                    .recipient(recipientEmail)
                    .businessId(businessId)
                    .businessName(businessName)
                    .processedItems(count)
                    .criticalItems(criticalCount)
                    .warningItems(warningCount)
                    .errorMessage("Missing recipient notification email")
                    .build();
        }

        if (atRiskItems == null || atRiskItems.isEmpty()) {
            log.info("EXPIRY_ALERT_SCAN: No qualifying expiring items to send for business '{}'", businessName);
            return ExpiryCheckResult.builder()
                    .success(true)
                    .status("SENT")
                    .recipient(recipientEmail)
                    .businessId(businessId)
                    .businessName(businessName)
                    .processedItems(0)
                    .criticalItems(0)
                    .warningItems(0)
                    .build();
        }

        String subject = String.format("StockUp AI — %d Medicine%s Approaching Expiry (%s)",
                count, count == 1 ? "" : "s", businessName);

        String htmlBody = buildConsolidatedEmailBody(businessName, atRiskItems);

        boolean isConfigured = mailSender != null
                && mailUsername != null && !mailUsername.isBlank()
                && mailPassword != null && !mailPassword.isBlank();

        boolean success = false;
        String status = "SIMULATED";
        String errorMsg = null;

        log.info("EXPIRY_EMAIL_SENDING: Preparing alert email for recipient='{}', business='{}', itemsCount={}, critical={}, warning={}, host='{}:{}'",
                recipientEmail, businessName, count, criticalCount, warningCount, mailHost, mailPort);

        if (isConfigured) {
            try {
                if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl impl) {
                    if (mailPassword != null && !mailPassword.isBlank()) {
                        impl.setPassword(mailPassword.replaceAll("\\s+", ""));
                    }
                    if (mailUsername != null && !mailUsername.isBlank()) {
                        impl.setUsername(mailUsername.trim());
                    }
                }
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                String fromAddress = (mailFrom != null && !mailFrom.isBlank()) ? mailFrom : mailUsername;
                helper.setFrom(fromAddress);
                helper.setTo(recipientEmail);
                helper.setSubject(subject);
                helper.setText(htmlBody, true);

                mailSender.send(message);
                success = true;
                status = "SENT";
                log.info("EXPIRY_EMAIL_SENT: Successfully delivered email to recipient='{}' via SMTP host '{}:{}'",
                        recipientEmail, mailHost, mailPort);
            } catch (Exception e) {
                log.error("EXPIRY_EMAIL_FAILED: Failed to deliver email to recipient='{}' via '{}:{}': {}",
                        recipientEmail, mailHost, mailPort, e.getMessage(), e);
                success = false;
                status = "FAILED";
                errorMsg = e.getMessage();
            }
        } else {
            // Simulated delivery when SMTP credentials are not set in environment
            log.warn("EXPIRY_EMAIL_SIMULATED: SMTP credentials not fully configured (MAIL_USERNAME / MAIL_PASSWORD). Simulated send to recipient='{}'", recipientEmail);
            success = true;
            status = "SIMULATED";
        }

        // Record audit logs for each notified item
        for (ExpiryItemDetails item : atRiskItems) {
            ExpiryNotificationLog logEntry = new ExpiryNotificationLog();
            logEntry.setBusinessId(businessId);
            logEntry.setItemId(item.getItemId());
            logEntry.setItemCode(item.getCode());
            logEntry.setItemName(item.getMedicineName());
            logEntry.setRecipientEmail(recipientEmail);
            logEntry.setAlertLevel(item.getRiskLevel());
            logEntry.setExpiryDate(item.getExpiryDate());
            logEntry.setDaysRemaining(item.getDaysUntilExpiry());
            logEntry.setStatus(status);
            logEntry.setSentAt(LocalDateTime.now());
            logEntry.setErrorMessage(errorMsg);
            logRepository.save(logEntry);
        }

        return ExpiryCheckResult.builder()
                .success(success)
                .status(status)
                .recipient(recipientEmail)
                .businessId(businessId)
                .businessName(businessName)
                .processedItems(count)
                .criticalItems(criticalCount)
                .warningItems(warningCount)
                .errorMessage(errorMsg)
                .build();
    }

    private String buildConsolidatedEmailBody(String businessName, List<ExpiryItemDetails> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        sb.append("<style>");
        sb.append("body { font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }");
        sb.append(".container { max-width: 650px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; margin: 0 auto; }");
        sb.append(".header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }");
        sb.append(".header h2 { color: #2563eb; margin: 0 0 6px 0; font-size: 22px; }");
        sb.append(".header p { color: #64748b; margin: 0; font-size: 14px; }");
        sb.append("table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }");
        sb.append("th { background: #eff6ff; color: #1e3a8a; font-weight: 600; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }");
        sb.append("td { padding: 10px; border-bottom: 1px solid #f1f5f9; }");
        sb.append(".badge-critical { background: #fee2e2; color: #b91c1c; font-weight: 700; padding: 3px 8px; border-radius: 6px; font-size: 11px; }");
        sb.append(".badge-warning { background: #fef3c7; color: #b45309; font-weight: 700; padding: 3px 8px; border-radius: 6px; font-size: 11px; }");
        sb.append(".footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 20px; }");
        sb.append("</style></head><body>");

        sb.append("<div class='container'>");
        sb.append("<div class='header'>");
        sb.append("<h2>StockUp AI — Expiry Risk Alert</h2>");
        sb.append("<p>Automated Inventory Expiry Monitor for <strong>").append(businessName).append("</strong></p>");
        sb.append("</div>");

        sb.append("<p>Hello Pharmacy Manager,</p>");
        sb.append("<p>The following medication(s) in your inventory are approaching expiration. Please review and initiate reorder or clearance action:</p>");

        sb.append("<table>");
        sb.append("<thead><tr>");
        sb.append("<th>Medicine Name</th>");
        sb.append("<th>NDC / Code</th>");
        sb.append("<th>Stock</th>");
        sb.append("<th>Expiry Date</th>");
        sb.append("<th>Days Left</th>");
        sb.append("<th>Severity</th>");
        sb.append("</tr></thead><tbody>");

        for (ExpiryItemDetails item : items) {
            String badge = "CRITICAL".equalsIgnoreCase(item.getRiskLevel())
                    ? "<span class='badge-critical'>CRITICAL</span>"
                    : "<span class='badge-warning'>WARNING</span>";

            String daysText = item.getDaysUntilExpiry() <= 0
                    ? "EXPIRED"
                    : item.getDaysUntilExpiry() + " days";

            sb.append("<tr>");
            sb.append("<td><strong>").append(item.getMedicineName()).append("</strong></td>");
            sb.append("<td><code>").append(item.getCode() != null ? item.getCode() : "—").append("</code></td>");
            sb.append("<td>").append(item.getQuantity()).append(" units</td>");
            sb.append("<td>").append(item.getExpiryDate()).append("</td>");
            sb.append("<td>").append(daysText).append("</td>");
            sb.append("<td>").append(badge).append("</td>");
            sb.append("</tr>");
        }

        sb.append("</tbody></table>");
        sb.append("<p style='font-size:13px;'>You can log in to StockUp AI to review full batch details, trigger optimized PO reorders, or manage clearance sales.</p>");

        sb.append("<div class='footer'>");
        sb.append("<p>StockUp AI — Multi-Tenant Pharmacy Inventory & AI Control Platform<br>");
        sb.append("This is an automated notification. Do not reply to this email.</p>");
        sb.append("</div>");
        sb.append("</div></body></html>");

        return sb.toString();
    }

    /**
     * Send a password reset OTP verification email to the user.
     */
    /**
     * Send a password reset OTP verification email to the user.
     */
    public boolean sendPasswordResetOtp(String recipientEmail, String otp) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("PASSWORD_RESET_EMAIL_FAILED: Missing recipient email");
            return false;
        }

        String domain = recipientEmail.contains("@") ? recipientEmail.substring(recipientEmail.indexOf("@") + 1) : "unknown";
        boolean hasPassword = mailPassword != null && !mailPassword.isBlank();
        String activeUser = (mailUsername != null && !mailUsername.isBlank()) ? mailUsername : "ag584160@gmail.com";
        String fromAddress = (mailFrom != null && !mailFrom.isBlank()) ? mailFrom : activeUser;

        log.info("PASSWORD_RESET_EMAIL_ATTEMPT: recipientDomain='{}', host='{}:{}', mailUsername='{}', mailFrom='{}', passwordConfigured={}",
                domain, mailHost, mailPort, activeUser, fromAddress, hasPassword);

        String subject = "StockUp AI — Password Reset Verification Code";
        String htmlBody = String.format(
            "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
            "<style>" +
            "body { font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }" +
            ".card { max-width: 500px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px; margin: 0 auto; }" +
            ".header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }" +
            ".header h2 { color: #2563eb; margin: 0; font-size: 20px; }" +
            ".otp-box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #1e293b; margin: 20px 0; }" +
            ".footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 24px; }" +
            "</style></head><body>" +
            "<div class='card'>" +
            "<div class='header'><h2>StockUp AI</h2></div>" +
            "<p>Hello,</p>" +
            "<p>We received a request to reset your StockUp AI account password.</p>" +
            "<p>Your verification code is:</p>" +
            "<div class='otp-box'>%s</div>" +
            "<p style='font-size:13px; color:#64748b;'>This code expires in <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>" +
            "<div class='footer'><p>StockUp AI — Intelligent Pharmacy Inventory & Control<br>Do not reply to this email.</p></div>" +
            "</div></body></html>",
            otp
        );

        if (mailSender != null) {
            try {
                if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl impl) {
                    if (mailPassword != null && !mailPassword.isBlank()) {
                        impl.setPassword(mailPassword.replaceAll("\\s+", ""));
                    }
                    if (mailUsername != null && !mailUsername.isBlank()) {
                        impl.setUsername(mailUsername.trim());
                    }
                }
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(fromAddress);
                helper.setTo(recipientEmail);
                helper.setSubject(subject);
                helper.setText(htmlBody, true);

                mailSender.send(message);
                log.info("PASSWORD_RESET_EMAIL_SENT: recipientDomain='{}'", domain);
                return true;
            } catch (Exception e) {
                log.error("PASSWORD_RESET_EMAIL_FAILED: recipientDomain='{}', errorType='{}', message='{}'",
                        domain, e.getClass().getSimpleName(), e.getMessage(), e);
                return false;
            }
        } else {
            log.warn("PASSWORD_RESET_EMAIL_SIMULATED: JavaMailSender bean unavailable. recipientDomain='{}'", domain);
            return true;
        }
    }
}
