package com.stockup.backend.repository;

import com.stockup.backend.model.ExpiryNotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpiryNotificationLogRepository extends JpaRepository<ExpiryNotificationLog, String> {

    List<ExpiryNotificationLog> findByBusinessIdOrderBySentAtDesc(String businessId);

    Optional<ExpiryNotificationLog> findFirstByBusinessIdAndItemIdAndAlertLevelAndExpiryDateAndStatus(
            String businessId, String itemId, String alertLevel, String expiryDate, String status);

    boolean existsByBusinessIdAndItemIdAndAlertLevelAndExpiryDateAndStatus(
            String businessId, String itemId, String alertLevel, String expiryDate, String status);

    boolean existsByBusinessIdAndItemCodeAndAlertLevelAndExpiryDateAndStatus(
            String businessId, String itemCode, String alertLevel, String expiryDate, String status);

    boolean existsByBusinessIdAndItemIdAndRecipientEmailAndAlertLevelAndExpiryDateAndStatus(
            String businessId, String itemId, String recipientEmail, String alertLevel, String expiryDate, String status);

    boolean existsByBusinessIdAndItemCodeAndRecipientEmailAndAlertLevelAndExpiryDateAndStatus(
            String businessId, String itemCode, String recipientEmail, String alertLevel, String expiryDate, String status);
}
