package com.stockup.backend.service;

import com.stockup.backend.dto.LoginRequest;
import com.stockup.backend.dto.LoginResponse;
import com.stockup.backend.dto.RegisterRequest;
import com.stockup.backend.dto.UserResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.core.userdetails.UserDetailsService;

public interface UserService extends UserDetailsService {

    LoginResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    UserResponse getProfile(@NonNull String userId);

    UserResponse getUserByEmail(@NonNull String email);

}