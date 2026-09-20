package com.stockup.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAuthResponse {

    private String status; // "SUCCESS", "BUSINESS_REQUIRED", "LINK_REQUIRED"
    private String token;
    private UserResponse user;
    private String email;
    private String name;
    private String message;
}
