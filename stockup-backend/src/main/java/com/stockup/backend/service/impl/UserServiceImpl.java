package com.stockup.backend.service.impl;

import com.stockup.backend.dto.LoginRequest;
import com.stockup.backend.dto.LoginResponse;
import com.stockup.backend.dto.RegisterRequest;
import com.stockup.backend.dto.UserResponse;
import com.stockup.backend.model.Business;
import com.stockup.backend.model.User;
import com.stockup.backend.repository.BusinessRepository;
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
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Autowired
    public UserServiceImpl(UserRepository userRepository,
                           BusinessRepository businessRepository,
                           JwtService jwtService,
                           @Lazy AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.businessRepository = businessRepository;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    @Override
    public LoginResponse register(RegisterRequest request) {
        // 1. Check if user email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already in use");
        }
        // 2. Check if user phone already exists
        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalStateException("Phone number already in use");
        }

        String businessId;
        String role;

        // 3. Create Business if business details provided
        if (request.getBusinessName() != null && !request.getBusinessName().trim().isEmpty()) {
            if (businessRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new IllegalStateException("Business with this email already exists");
            }
            if (businessRepository.findByPhone(request.getPhone()).isPresent()) {
                throw new IllegalStateException("Business with this phone number already exists");
            }

            String owner = (request.getOwnerName() != null && !request.getOwnerName().trim().isEmpty())
                    ? request.getOwnerName().trim()
                    : request.getFullName().trim();

            Business business = new Business();
            business.setBusinessName(request.getBusinessName().trim());
            business.setOwnerName(owner);
            business.setEmail(request.getEmail().trim());
            business.setPhone(request.getPhone().trim());
            business.setBusinessType(request.getBusinessType() != null ? request.getBusinessType().trim() : "Pharmacy");
            business.setAddress(request.getAddress() != null ? request.getAddress().trim() : "");
            business.setCity(request.getCity() != null ? request.getCity().trim() : "");
            business.setState(request.getState() != null ? request.getState().trim() : "");
            business.setCountry(request.getCountry() != null ? request.getCountry().trim() : "");
            business.setPincode(request.getPincode() != null ? request.getPincode().trim() : "");
            business.setCreatedAt(LocalDateTime.now());

            Business savedBusiness = businessRepository.save(business);
            businessId = savedBusiness.getId();
            role = "ADMIN"; // First registered user for the newly created business is always ADMIN
        } else if (request.getBusinessId() != null && !request.getBusinessId().trim().isEmpty()) {
            businessId = request.getBusinessId().trim();
            long userCountForBusiness = userRepository.countByBusinessId(businessId);
            role = (userCountForBusiness == 0) ? "ADMIN" : "STAFF";
        } else {
            throw new IllegalArgumentException("Business information is required");
        }

        // Encrypt password
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(request.getEmail().trim());
        user.setPhone(request.getPhone().trim());
        user.setPassword(encodedPassword);
        user.setRole(role);
        user.setBusinessId(businessId);
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
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        if (email == null) {
            throw new UsernameNotFoundException("Email cannot be null");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole())
                .build();
    }
}