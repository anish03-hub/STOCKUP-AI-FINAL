package com.stockup.backend.service;

import com.stockup.backend.dto.ExpiryCheckResult;
import com.stockup.backend.dto.ExpiryItemDetails;
import com.stockup.backend.model.Business;
import com.stockup.backend.model.Item;
import com.stockup.backend.model.User;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.repository.ExpiryNotificationLogRepository;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpirySchedulerService {

    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final ExpiryNotificationLogRepository notificationLogRepository;
    private final EmailNotificationService emailNotificationService;

    /**
     * Daily scheduled job at 8:00 AM to scan all tenant businesses for expiring stock.
     */
    @Scheduled(cron = "${expiry.scan.cron:0 0 8 * * ?}")
    @Transactional
    public void runScheduledExpiryScan() {
        log.info("EXPIRY_ALERT_SCAN_STARTED: Commencing daily multi-tenant medicine expiry check...");
        List<Business> businesses = businessRepository.findAll();

        for (Business business : businesses) {
            try {
                runExpiryCheckForBusiness(business.getId(), null);
            } catch (Exception e) {
                log.error("EXPIRY_ALERT_SCAN_ERROR: Failed to run expiry scan for business '{}' ({}): {}",
                        business.getBusinessName(), business.getId(), e.getMessage(), e);
            }
        }
        log.info("EXPIRY_ALERT_SCAN_COMPLETED: Multi-tenant expiry scan finished.");
    }

    /**
     * Run expiry check & send notification for a specific business tenant.
     */
    @Transactional
    public ExpiryCheckResult runExpiryCheckForBusiness(String businessId, String overrideRecipientEmail) {
        if (businessId == null || businessId.isBlank()) {
            return ExpiryCheckResult.builder()
                    .success(false)
                    .status("FAILED")
                    .errorMessage("Business ID is empty")
                    .build();
        }

        Business business = businessRepository.findById(businessId).orElse(null);
        String businessName = business != null ? business.getBusinessName() : "StockUp AI Pharmacy";

        // Determine recipient email: override > user.notificationEmail > user.email > business.email
        String recipientEmail = overrideRecipientEmail;
        if (recipientEmail == null || recipientEmail.isBlank()) {
            Optional<User> adminUserOpt = userRepository.findAll().stream()
                    .filter(u -> businessId.equals(u.getBusinessId()))
                    .findFirst();

            if (adminUserOpt.isPresent()) {
                User u = adminUserOpt.get();
                recipientEmail = (u.getNotificationEmail() != null && !u.getNotificationEmail().isBlank())
                        ? u.getNotificationEmail()
                        : u.getEmail();
            }

            if ((recipientEmail == null || recipientEmail.isBlank()) && business != null) {
                recipientEmail = business.getEmail();
            }
        }

        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("EXPIRY_ALERT_SKIP: No notification email configured for business '{}' ({})", businessName, businessId);
            return ExpiryCheckResult.builder()
                    .success(false)
                    .status("FAILED")
                    .businessId(businessId)
                    .businessName(businessName)
                    .errorMessage("No notification email configured for business")
                    .build();
        }

        List<Item> businessItems = itemRepository.findByBusinessId(businessId);
        LocalDate today = LocalDate.now();

        List<ExpiryItemDetails> qualifyingItems = new ArrayList<>();
        int criticalCount = 0;
        int warningCount = 0;

        for (Item item : businessItems) {
            if (item.getExpiryDate() == null || item.getExpiryDate().trim().isEmpty()) {
                continue;
            }

            LocalDate expDate = parseDateSafely(item.getExpiryDate());
            if (expDate == null) continue;

            long daysLeft = ChronoUnit.DAYS.between(today, expDate);

            String alertLevel = null;
            if (daysLeft <= 30) {
                alertLevel = "CRITICAL";
            } else if (daysLeft <= 90) {
                alertLevel = "WARNING";
            }

            if (alertLevel != null) {
                // Deduplication check: Has a notification already been SENT to THIS RECIPIENT for this item at this alert level for this expiryDate?
                boolean alreadyNotified = (item.getId() != null && notificationLogRepository
                        .existsByBusinessIdAndItemIdAndRecipientEmailAndAlertLevelAndExpiryDateAndStatus(
                                businessId, item.getId(), recipientEmail, alertLevel, item.getExpiryDate(), "SENT"))
                        || (item.getCode() != null && notificationLogRepository
                        .existsByBusinessIdAndItemCodeAndRecipientEmailAndAlertLevelAndExpiryDateAndStatus(
                                businessId, item.getCode(), recipientEmail, alertLevel, item.getExpiryDate(), "SENT"));

                if (!alreadyNotified) {
                    if ("CRITICAL".equalsIgnoreCase(alertLevel)) criticalCount++;
                    if ("WARNING".equalsIgnoreCase(alertLevel)) warningCount++;

                    int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                    double price = item.getPrice() != null ? item.getPrice() : 0.0;
                    ExpiryItemDetails details = new ExpiryItemDetails(
                            item.getName(),
                            item.getCategory(),
                            item.getManufacturer(),
                            qty,
                            price,
                            item.getExpiryDate(),
                            daysLeft,
                            alertLevel,
                            qty * price
                    );
                    details.setItemId(item.getId());
                    details.setCode(item.getCode());
                    qualifyingItems.add(details);
                }
            }
        }

        log.info("EXPIRY_EMAIL_DEBUG: businessId='{}', recipient='{}', qualifyingItems={}, criticalItems={}, warningItems={}",
                businessId, recipientEmail, qualifyingItems.size(), criticalCount, warningCount);

        if (qualifyingItems.isEmpty()) {
            log.info("EXPIRY_ALERT_FOUND: Business '{}' ({}) has 0 new qualifying expiring items to notify.", businessName, businessId);
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

        // Sort items by urgency (days until expiry)
        qualifyingItems.sort((a, b) -> Long.compare(a.getDaysUntilExpiry(), b.getDaysUntilExpiry()));

        return emailNotificationService.sendConsolidatedExpiryAlert(
                businessId, businessName, recipientEmail, qualifyingItems);
    }

    private LocalDate parseDateSafely(String dateStr) {
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException e) {
            try {
                return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("M/d/yyyy"));
            } catch (DateTimeParseException ex) {
                return null;
            }
        }
    }
}
