package com.stockup.backend.controller;

import com.stockup.backend.dto.ChangePasswordRequest;
import com.stockup.backend.dto.UserResponse;
import com.stockup.backend.dto.UserSummaryDTO;
import com.stockup.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetUserSummary_ReturnsSummaryDTO() {
        UserSummaryDTO mockSummary = UserSummaryDTO.builder()
                .totalUsers(5)
                .googleUsers(3)
                .localUsers(1)
                .bothUsers(1)
                .build();

        when(userService.getUserSummary()).thenReturn(mockSummary);

        ResponseEntity<UserSummaryDTO> response = userController.getUserSummary();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(5, response.getBody().getTotalUsers());
        assertEquals(3, response.getBody().getGoogleUsers());
        assertEquals(1, response.getBody().getLocalUsers());
        assertEquals(1, response.getBody().getBothUsers());

        verify(userService, times(1)).getUserSummary();
    }

    @Test
    public void testGetUsers_ReturnsUserList() {
        UserResponse mockUser = UserResponse.builder()
                .id("user-uuid-1")
                .fullName("Anish Kumar")
                .email("ag584160@gmail.com")
                .authProvider("GOOGLE")
                .role("ADMIN")
                .businessId("biz-1")
                .businessName("StockUp Pharmacy")
                .createdAt(LocalDateTime.now())
                .build();

        when(userService.getUsersForManagement(null, null)).thenReturn(List.of(mockUser));

        ResponseEntity<List<UserResponse>> response = userController.getUsers(null, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        UserResponse resUser = response.getBody().get(0);
        assertEquals("Anish Kumar", resUser.getFullName());
        assertEquals("ag584160@gmail.com", resUser.getEmail());
        assertEquals("GOOGLE", resUser.getAuthProvider());

        verify(userService, times(1)).getUsersForManagement(null, null);
    }

    @Test
    public void testChangePassword_ValidRequest_ReturnsOkMessage() {
        ChangePasswordRequest request = new ChangePasswordRequest("OldPassword123!", "NewPassword123!");
        doNothing().when(userService).changePassword(any());

        ResponseEntity<Map<String, String>> response = userController.changePassword(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Password changed successfully.", response.getBody().get("message"));

        verify(userService, times(1)).changePassword(request);
    }
}
