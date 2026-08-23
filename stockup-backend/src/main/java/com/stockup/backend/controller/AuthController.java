package com.stockup.backend.controller;

import com.stockup.backend.dto.LoginRequest;
import com.stockup.backend.dto.LoginResponse;
import com.stockup.backend.dto.RegisterRequest;
import com.stockup.backend.dto.UserResponse;
import com.stockup.backend.security.JwtService;
import com.stockup.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = userService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> profile(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7); // Remove "Bearer "
        String email = jwtService.extractUsername(token);
        if (email == null) {
            throw new IllegalArgumentException("Invalid token");
        }
        UserResponse user = userService.getUserByEmail(email);
        return ResponseEntity.ok(user);
    }
}