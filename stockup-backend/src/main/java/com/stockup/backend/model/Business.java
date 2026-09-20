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
@Table(name = "businesses")
public class Business {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String businessName;
    private String ownerName;
    private String email;
    private String phone;
    private String businessType;
    
    @Column(length = 500)
    private String address;
    
    private String city;
    private String state;
    private String country;
    private String pincode;
    
    @Column(name = "currency", length = 10)
    private String currency = "USD";

    private LocalDateTime createdAt;
}