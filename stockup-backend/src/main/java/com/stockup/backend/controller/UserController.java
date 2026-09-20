package com.stockup.backend.controller;

import com.stockup.backend.dto.ChangePasswordRequest;
import com.stockup.backend.dto.UserResponse;
import com.stockup.backend.dto.UserSummaryDTO;
import com.stockup.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/summary")
    public ResponseEntity<UserSummaryDTO> getUserSummary() {
        UserSummaryDTO summary = userService.getUserSummary();
        return ResponseEntity.ok(summary);
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String authProvider) {
        List<UserResponse> users = userService.getUsersForManagement(search, authProvider);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Password changed successfully.");
        return ResponseEntity.ok(response);
    }
}
