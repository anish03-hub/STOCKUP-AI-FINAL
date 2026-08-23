package com.stockup.backend.service.impl;

import com.stockup.backend.dto.LoginRequest;
import com.stockup.backend.dto.LoginResponse;
import com.stockup.backend.dto.RegisterRequest;
import com.stockup.backend.dto.UserResponse;
import com.stockup.backend.model.User;
import com.stockup.backend.repository.UserRepository;
import com.stockup.backend.security.JwtService;
import com.stockup.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Autowired
    public UserServiceImpl(UserRepository userRepository,
                           JwtService jwtService,
                           @Lazy AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public LoginResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already in use");
        }
        // Check if phone already exists
        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalStateException("Phone number already in use");
        }

        // Determine role: ADMIN if first user for this business, else STAFF
        long userCountForBusiness = userRepository.countByBusinessId(request.getBusinessId());
        String role = (userCountForBusiness == 0) ? "ADMIN" : "STAFF";

        // Encrypt password
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(encodedPassword);
        user.setRole(role);
        user.setBusinessId(request.getBusinessId());
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Generate JWT token
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(savedUser.getEmail())
                .password(savedUser.getPassword())
                .roles(savedUser.getRole())
                .build();

        String token = jwtService.generateToken(userDetails);

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUser(mapToUserResponse(savedUser));

        return response;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtService.generateToken(userDetails);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUser(mapToUserResponse(user));

        return response;
    }

    @Override
    public UserResponse getProfile(@NonNull String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getBusinessId(),
                user.getCreatedAt()
        );
    }

    @Override
    public UserResponse getUserByEmail(@NonNull String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found with email: " + email));
        return mapToUserResponse(user);
    }

    // Implement UserDetailsService method
    @Override
    public UserDetails loadUserByUsername(@NonNull String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole())
                .build();
    }
}