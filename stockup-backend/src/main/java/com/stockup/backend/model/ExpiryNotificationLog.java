package com.stockup.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "expiry_notification_logs")
public class ExpiryNotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "business_id", nullable = false)
    private String businessId;

    @Column(name = "item_id")
    private String itemId;

    @Column(name = "item_code")
    private String itemCode;

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    @Column(name = "alert_level", nullable = false)
    private String alertLevel; // CRITICAL, WARNING

    @Column(name = "expiry_date")
    private String expiryDate;

    @Column(name = "days_remaining")
    private long daysRemaining;

    @Column(name = "status", nullable = false)
    private String status; // SENT, FAILED, SIMULATED

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;
}
