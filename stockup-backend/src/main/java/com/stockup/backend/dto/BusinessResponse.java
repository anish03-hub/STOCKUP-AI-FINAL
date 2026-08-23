package com.stockup.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusinessResponse {

    private String id;
    private String businessName;
    private String ownerName;
    private String email;
    private String phone;
    private String businessType;
    private String address;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private LocalDateTime createdAt;

}