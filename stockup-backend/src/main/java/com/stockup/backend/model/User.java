package com.stockup.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String fullName;
    
    @Column(unique = true)
    private String email;
    
    private String phone;
    private String password;
    private String role;
    private String businessId;
    
    @Column(name = "google_subject")
    private String googleSubject;
    
    @Column(name = "auth_provider")
    private String authProvider = "LOCAL";
    
    @Column(name = "notification_email")
    private String notificationEmail;

    private LocalDateTime createdAt;
}