package com.stockup.backend.controller;

import com.stockup.backend.model.ExpiryNotificationLog;
import com.stockup.backend.model.User;
import com.stockup.backend.repository.ExpiryNotificationLogRepository;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.service.ExpirySchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.stockup.backend.dto.TestExpiryEmailRequest;
import jakarta.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class NotificationController {

    private final CurrentUserService currentUserService;
    private final ExpirySchedulerService expirySchedulerService;
    private final ExpiryNotificationLogRepository logRepository;

    /**
     * Manual endpoint for authenticated pharmacy user to trigger an expiry email notification test.
     */
    @PostMapping("/test-expiry-email")
    public ResponseEntity<Map<String, Object>> triggerTestExpiryEmail(
            @Valid @RequestBody(required = false) TestExpiryEmailRequest request,
            @RequestParam(required = false) String recipientEmail) {

        Optional<String> businessIdOpt = currentUserService.getCurrentUserBusinessIdOptional();
        if (businessIdOpt.isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "User has no associated Business tenant.");
            return ResponseEntity.badRequest().body(err);
        }

        String businessId = businessIdOpt.get();

        // Target email priority: request body > query param > user.notificationEmail > user.email
        String targetEmail = null;
        if (request != null && request.getRecipientEmail() != null && !request.getRecipientEmail().isBlank()) {
            targetEmail = request.getRecipientEmail().trim();
        } else if (recipientEmail != null && !recipientEmail.isBlank()) {
            targetEmail = recipientEmail.trim();
        }

        if (targetEmail == null || targetEmail.isBlank()) {
            Optional<User> currentUserOpt = currentUserService.getCurrentUserOptional();
            if (currentUserOpt.isPresent()) {
                User u = currentUserOpt.get();
                targetEmail = (u.getNotificationEmail() != null && !u.getNotificationEmail().isBlank())
                        ? u.getNotificationEmail()
                        : u.getEmail();
            }
        }

        log.info("MANUAL_EXPIRY_EMAIL_TRIGGER: Initiating expiry alert notification for businessId='{}', recipient='{}'",
                businessId, targetEmail);

        com.stockup.backend.dto.ExpiryCheckResult checkResult = expirySchedulerService.runExpiryCheckForBusiness(businessId, targetEmail);

        Map<String, Object> response = new HashMap<>();
        response.put("success", checkResult.isSuccess());
        response.put("status", checkResult.getStatus());
        response.put("recipient", checkResult.getRecipient());
        response.put("businessId", checkResult.getBusinessId());
        response.put("businessName", checkResult.getBusinessName());
        response.put("processedItems", checkResult.getProcessedItems());
        response.put("itemsFound", checkResult.getProcessedItems()); // Backward-compatibility
        response.put("criticalItems", checkResult.getCriticalItems());
        response.put("warningItems", checkResult.getWarningItems());
        response.put("errorMessage", checkResult.getErrorMessage());
        response.put("timestamp", java.time.LocalDateTime.now().toString());

        // Fetch latest log for notifiedItem name if available
        List<ExpiryNotificationLog> history = logRepository.findByBusinessIdOrderBySentAtDesc(businessId);
        if (!history.isEmpty()) {
            response.put("notifiedItem", history.get(0).getItemName());
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Get recent notification history log for authenticated user's business tenant.
     */
    @GetMapping("/expiry-history")
    public ResponseEntity<List<ExpiryNotificationLog>> getExpiryNotificationHistory() {
        Optional<String> businessIdOpt = currentUserService.getCurrentUserBusinessIdOptional();
        if (businessIdOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        List<ExpiryNotificationLog> history = logRepository.findByBusinessIdOrderBySentAtDesc(businessIdOpt.get());
        return ResponseEntity.ok(history);
    }

    /**
     * Trigger full multi-tenant expiry check scan (Admin/Service endpoint).
     */
    @PostMapping("/run-expiry-scan")
    public ResponseEntity<Map<String, Object>> runFullExpiryScan() {
        log.info("MANUAL_FULL_EXPIRY_SCAN_TRIGGERED");
        expirySchedulerService.runScheduledExpiryScan();
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "Multi-tenant expiry scan triggered successfully.");
        return ResponseEntity.ok(resp);
    }
}
