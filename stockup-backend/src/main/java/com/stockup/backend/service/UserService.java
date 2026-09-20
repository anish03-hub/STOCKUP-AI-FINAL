package com.stockup.backend.service;

import com.stockup.backend.dto.ChangePasswordRequest;
import com.stockup.backend.dto.GoogleAuthRequest;
import com.stockup.backend.dto.GoogleAuthResponse;
import com.stockup.backend.dto.LoginRequest;
import com.stockup.backend.dto.LoginResponse;
import com.stockup.backend.dto.RegisterRequest;
import com.stockup.backend.dto.RegisterResponse;
import com.stockup.backend.dto.UserResponse;
import com.stockup.backend.dto.UserSummaryDTO;
import org.springframework.lang.NonNull;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;

public interface UserService extends UserDetailsService {

    RegisterResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    GoogleAuthResponse authenticateGoogleUser(GoogleAuthRequest request);

    UserResponse getProfile(@NonNull String userId);

    UserResponse getUserByEmail(@NonNull String email);

    UserSummaryDTO getUserSummary();

    List<UserResponse> getUsersForManagement(String search, String authProvider);

    void changePassword(ChangePasswordRequest request);

}