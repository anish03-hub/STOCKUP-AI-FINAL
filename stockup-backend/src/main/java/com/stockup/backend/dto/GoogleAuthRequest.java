package com.stockup.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAuthRequest {

    @NotBlank(message = "Google credential token is required")
    private String credential;

    // Optional fields for new business setup or account linking
    private String businessName;
    private String businessType;
    private String phone;
    private String address;
    private String password;
}
