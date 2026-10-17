package com.stockup.backend.config;

import com.stockup.backend.model.User;
import com.stockup.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class UserDataInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserDataInitializer initializer;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        initializer = new UserDataInitializer(userRepository, passwordEncoder);
        org.springframework.test.util.ReflectionTestUtils.setField(initializer, "adminPassword", "Password123!");
    }

    @Test
    @DisplayName("Existing user password must be preserved during initialization")
    public void testExistingUser_PasswordPreserved() {
        User existingUser = new User();
        existingUser.setId("user-existing-1");
        existingUser.setEmail("ag584160@gmail.com");
        existingUser.setPassword("$2a$10$existingSecureHashedPasswordThatMustNotBeOverwritten");
        existingUser.setRole("ADMIN");
        existingUser.setAuthProvider("BOTH");
        existingUser.setBusinessId("biz-default");

        when(userRepository.count()).thenReturn(1L);
        when(userRepository.findByEmailIgnoreCase("ag584160@gmail.com")).thenReturn(Optional.of(existingUser));

        initializer.onApplicationReady();

        // PasswordEncoder.encode must NEVER be called to overwrite existing password
        verify(passwordEncoder, never()).encode(any());
        assertEquals("$2a$10$existingSecureHashedPasswordThatMustNotBeOverwritten", existingUser.getPassword());
    }

    @Test
    @DisplayName("Target user without password receives initialized credentials")
    public void testExistingUser_BlankPassword_SetsInitialPassword() {
        User existingUserWithoutPassword = new User();
        existingUserWithoutPassword.setId("user-no-pw");
        existingUserWithoutPassword.setEmail("ag584160@gmail.com");
        existingUserWithoutPassword.setPassword(null);
        existingUserWithoutPassword.setRole("ADMIN");
        existingUserWithoutPassword.setAuthProvider("BOTH");
        existingUserWithoutPassword.setBusinessId("biz-default");

        when(userRepository.count()).thenReturn(1L);
        when(userRepository.findByEmailIgnoreCase("ag584160@gmail.com")).thenReturn(Optional.of(existingUserWithoutPassword));
        when(passwordEncoder.encode("Password123!")).thenReturn("$2a$10$newlyEncodedPassword");

        initializer.onApplicationReady();

        verify(passwordEncoder, times(1)).encode("Password123!");
        assertEquals("$2a$10$newlyEncodedPassword", existingUserWithoutPassword.getPassword());
        verify(userRepository, times(1)).save(existingUserWithoutPassword);
    }
}
