package com.stockup.backend.service.impl;

import com.stockup.backend.dto.BusinessResponse;
import com.stockup.backend.dto.LoginRequest;
import com.stockup.backend.dto.LoginResponse;
import com.stockup.backend.dto.RegisterRequest;
import com.stockup.backend.dto.RegisterResponse;
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

import com.stockup.backend.service.CompanyOnboardingService;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.stockup.backend.dto.GoogleAuthRequest;
import com.stockup.backend.dto.GoogleAuthResponse;
import com.stockup.backend.dto.UserSummaryDTO;
import com.stockup.backend.security.CurrentUserService;
import com.stockup.backend.security.GoogleTokenVerifierService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.stockup.backend.dto.ChangePasswordRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CompanyOnboardingService companyOnboardingService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final CurrentUserService currentUserService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserServiceImpl(UserRepository userRepository,
                           BusinessRepository businessRepository,
                           JwtService jwtService,
                           @Lazy AuthenticationManager authenticationManager,
                           CompanyOnboardingService companyOnboardingService,
                           GoogleTokenVerifierService googleTokenVerifierService,
                           CurrentUserService currentUserService,
                           @Lazy PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.businessRepository = businessRepository;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.companyOnboardingService = companyOnboardingService;
        this.googleTokenVerifierService = googleTokenVerifierService;
        this.currentUserService = currentUserService;
        this.passwordEncoder = passwordEncoder;
    }


    public static final String COMPANY_EMAIL_DOMAIN = "@stockupai.in";

    @Transactional
    @Override
    public RegisterResponse register(RegisterRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Registration request cannot be null");
        }

        // 1. Password confirmation check
        if (request.getConfirmPassword() != null && !request.getConfirmPassword().isEmpty()) {
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new IllegalArgumentException("Passwords do not match.");
            }
        }

        // 2. Normalize and validate company email with @stockupai.in domain
        String companyEmail = normalizeAndValidateCompanyEmail(request.getEmail());

        // 3. Check if user email or phone already exists
        if (userRepository.findByEmail(companyEmail).isPresent() ||
                businessRepository.findByEmail(companyEmail).isPresent()) {
            throw new IllegalStateException("Company email is already registered.");
        }
        if (userRepository.findByPhone(request.getPhone()).isPresent() ||
                businessRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalStateException("Phone number already in use");
        }

        String businessId;
        String role;
        Business savedBusiness = null;

        // 4. Create Business if business details provided
        if (request.getBusinessName() != null && !request.getBusinessName().trim().isEmpty()) {
            String owner = (request.getOwnerName() != null && !request.getOwnerName().trim().isEmpty())
                    ? request.getOwnerName().trim()
                    : (request.getFullName() != null && !request.getFullName().trim().isEmpty() ? request.getFullName().trim() : request.getBusinessName().trim());

            Business business = new Business();
            business.setBusinessName(request.getBusinessName().trim());
            business.setOwnerName(owner);
            business.setEmail(companyEmail);
            business.setPhone(request.getPhone().trim());
            business.setBusinessType(request.getBusinessType() != null ? request.getBusinessType().trim() : "Pharmacy");
            business.setAddress(request.getAddress() != null ? request.getAddress().trim() : "");
            business.setCity(request.getCity() != null ? request.getCity().trim() : "");
            business.setState(request.getState() != null ? request.getState().trim() : "");
            business.setCountry(request.getCountry() != null ? request.getCountry().trim() : "");
            business.setPincode(request.getPincode() != null ? request.getPincode().trim() : "");
            business.setCreatedAt(LocalDateTime.now());

            savedBusiness = businessRepository.save(business);
            businessId = savedBusiness.getId();
            role = "ADMIN"; // First registered user for the newly created company is always ADMIN
        } else if (request.getBusinessId() != null && !request.getBusinessId().trim().isEmpty()) {
            businessId = request.getBusinessId().trim();
            long userCountForBusiness = userRepository.countByBusinessId(businessId);
            role = (userCountForBusiness == 0) ? "ADMIN" : "STAFF";
            savedBusiness = businessRepository.findById(businessId).orElse(null);
        } else {
            throw new IllegalArgumentException("Business information is required");
        }

        // 5. Encrypt password using BCrypt
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        String adminFullName = (request.getFullName() != null && !request.getFullName().trim().isEmpty())
                ? request.getFullName().trim()
                : (request.getOwnerName() != null && !request.getOwnerName().trim().isEmpty() ? request.getOwnerName().trim() : request.getBusinessName().trim());

        User user = new User();
        user.setFullName(adminFullName);
        user.setEmail(companyEmail);
        user.setPhone(request.getPhone().trim());
        user.setPassword(encodedPassword);
        user.setRole(role);
        user.setBusinessId(businessId);
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Initialize company catalog & supplier data for multi-tenancy
        if (savedBusiness != null) {
            companyOnboardingService.ensureCompanyCatalogInitialized(businessId, savedBusiness.getBusinessName());
        }

        return RegisterResponse.builder()

                .message("Company account created successfully")
                .user(mapToUserResponse(savedUser))
                .business(savedBusiness != null ? mapToBusinessResponse(savedBusiness) : null)
                .build();
    }

    private String normalizeAndValidateCompanyEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Company email is required");
        }
        String input = rawEmail.trim().toLowerCase();
        String prefix;
        if (input.contains("@")) {
            if (!input.endsWith(COMPANY_EMAIL_DOMAIN)) {
                throw new IllegalArgumentException("Company email must use the @stockupai.in domain.");
            }
            prefix = input.substring(0, input.length() - COMPANY_EMAIL_DOMAIN.length());
        } else {
            prefix = input;
        }

        String normalizedPrefix = prefix.replaceAll("\\s+", "").replaceAll("[^a-z0-9._-]", "");
        if (normalizedPrefix.isEmpty()) {
            throw new IllegalArgumentException("Company email prefix contains no valid characters");
        }

        return normalizedPrefix + COMPANY_EMAIL_DOMAIN;
    }

    private BusinessResponse mapToBusinessResponse(Business business) {
        return new BusinessResponse(
                business.getId(),
                business.getBusinessName(),
                business.getOwnerName(),
                business.getEmail(),
                business.getPhone(),
                business.getBusinessType(),
                business.getAddress(),
                business.getCity(),
                business.getState(),
                business.getCountry(),
                business.getPincode(),
                business.getCurrency() != null ? business.getCurrency() : "USD",
                business.getCreatedAt()
        );
    }


    @Override
    public LoginResponse login(LoginRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        String rawEmail = request.getEmail().trim();
        String normalizedEmail = rawEmail.toLowerCase();

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            normalizedEmail,
                            request.getPassword()
                    )
            );
        } catch (Exception err) {
            try {
                authentication = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                rawEmail,
                                request.getPassword()
                        )
                );
            } catch (Exception _err) {
                throw err;
            }
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtService.generateToken(userDetails);

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseGet(() -> userRepository.findByEmailIgnoreCase(rawEmail)
                        .orElseThrow(() -> new IllegalStateException("User not found")));

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
        String businessName = null;
        if (user.getBusinessId() != null && !user.getBusinessId().trim().isEmpty()) {
            businessName = businessRepository.findById(user.getBusinessId())
                    .map(Business::getBusinessName)
                    .orElse(null);
        }
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider() : "LOCAL")
                .role(user.getRole())
                .businessId(user.getBusinessId())
                .businessName(businessName)
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    public UserResponse getUserByEmail(@NonNull String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found with email: " + email));
        return mapToUserResponse(user);
    }

    @Override
    public UserSummaryDTO getUserSummary() {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        long total;
        long google;
        long local;
        long both;

        if (bOpt.isPresent() && !bOpt.get().trim().isEmpty()) {
            String bId = bOpt.get().trim();
            total = userRepository.countByBusinessId(bId);
            google = userRepository.countByBusinessIdAndAuthProvider(bId, "GOOGLE");
            both = userRepository.countByBusinessIdAndAuthProvider(bId, "BOTH");
            local = Math.max(0, total - google - both);
        } else {
            total = userRepository.count();
            google = userRepository.countByAuthProvider("GOOGLE");
            both = userRepository.countByAuthProvider("BOTH");
            local = Math.max(0, total - google - both);
        }

        return UserSummaryDTO.builder()
                .totalUsers(total)
                .googleUsers(google)
                .localUsers(local)
                .bothUsers(both)
                .build();
    }

    @Override
    public List<UserResponse> getUsersForManagement(String search, String authProvider) {
        Optional<String> bOpt = currentUserService.getCurrentUserBusinessIdOptional();
        List<User> users;

        if (bOpt.isPresent() && !bOpt.get().trim().isEmpty()) {
            users = userRepository.findByBusinessId(bOpt.get().trim());
        } else {
            users = userRepository.findAll();
        }

        String searchLower = (search != null) ? search.trim().toLowerCase() : "";
        String filterProvider = (authProvider != null && !authProvider.trim().isEmpty() && !"ALL".equalsIgnoreCase(authProvider.trim()))
                ? authProvider.trim().toUpperCase()
                : null;

        return users.stream()
                .filter(u -> {
                    if (filterProvider != null) {
                        String userProvider = u.getAuthProvider() != null ? u.getAuthProvider().toUpperCase() : "LOCAL";
                        if (!userProvider.equals(filterProvider)) {
                            return false;
                        }
                    }
                    if (!searchLower.isEmpty()) {
                        String name = u.getFullName() != null ? u.getFullName().toLowerCase() : "";
                        String email = u.getEmail() != null ? u.getEmail().toLowerCase() : "";
                        return name.contains(searchLower) || email.contains(searchLower);
                    }
                    return true;
                })
                .map(this::mapToUserResponse)
                .toList();
    }

    // Implement UserDetailsService method
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        if (email == null || email.isBlank()) {
            throw new UsernameNotFoundException("Email cannot be null or blank");
        }
        String normalized = email.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalized)
                .orElseGet(() -> userRepository.findByEmail(normalized)
                        .orElseGet(() -> userRepository.findByEmail(email)
                                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email))));
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole() != null ? user.getRole() : "ADMIN")
                .build();
    }

    @Transactional
    @Override
    public GoogleAuthResponse authenticateGoogleUser(GoogleAuthRequest request) {
        if (request == null || request.getCredential() == null || request.getCredential().isBlank()) {
            throw new IllegalArgumentException("Google authentication request credential cannot be null or blank.");
        }

        // 1. Verify Google ID Token
        GoogleIdToken.Payload payload = googleTokenVerifierService.verifyToken(request.getCredential());
        String googleSub = payload.getSubject();
        String googleEmail = payload.getEmail() != null ? payload.getEmail().trim().toLowerCase() : null;
        String googleName = (String) payload.get("name");
        if (googleName == null || googleName.isBlank()) {
            googleName = googleEmail != null ? googleEmail.split("@")[0] : "Google User";
        }

        if (googleSub == null || googleSub.isBlank() || googleEmail == null || googleEmail.isBlank()) {
            throw new IllegalArgumentException("Google token payload is missing subject or email.");
        }

        // 2. Check if user exists by googleSubject or by email
        User existingUser = userRepository.findByGoogleSubject(googleSub)
                .orElseGet(() -> userRepository.findByEmail(googleEmail).orElse(null));

        if (existingUser != null) {
            String busId = existingUser.getBusinessId();
            boolean hasValidBusiness = busId != null && !busId.isBlank() && businessRepository.findById(busId).isPresent();

            if (hasValidBusiness) {
                // CASE A — Existing Google user with valid Business
                if (existingUser.getGoogleSubject() == null || existingUser.getGoogleSubject().isBlank()) {
                    existingUser.setGoogleSubject(googleSub);
                    if (existingUser.getAuthProvider() == null || existingUser.getAuthProvider().isBlank()) {
                        existingUser.setAuthProvider("BOTH");
                    }
                    userRepository.save(existingUser);
                }
                UserDetails userDetails = loadUserByUsername(existingUser.getEmail());
                String token = jwtService.generateToken(userDetails);

                return GoogleAuthResponse.builder()
                        .status("SUCCESS")
                        .token(token)
                        .user(mapToUserResponse(existingUser))
                        .message("Welcome back! Google authentication successful.")
                        .build();
            }

            // CASE C — Existing Google user with dangling/nonexistent businessId
            if (request.getBusinessName() == null || request.getBusinessName().trim().isBlank()) {
                return GoogleAuthResponse.builder()
                        .status("BUSINESS_REQUIRED")
                        .email(googleEmail)
                        .name(googleName)
                        .message("Please enter your Pharmacy or Business Name to complete your StockUp AI account setup.")
                        .build();
            }

            // Onboarding form submitted for existing user with dangling/missing business
            String businessName = request.getBusinessName().trim();
            String businessType = (request.getBusinessType() != null && !request.getBusinessType().trim().isBlank())
                    ? request.getBusinessType().trim()
                    : "Hospital Pharmacy";

            String phone = (request.getPhone() != null) ? request.getPhone().trim() : "";
            String address = (request.getAddress() != null) ? request.getAddress().trim() : "";

            Business business = new Business();
            business.setBusinessName(businessName);
            business.setOwnerName(googleName);
            business.setEmail(googleEmail);
            business.setPhone(phone);
            business.setAddress(address);
            business.setBusinessType(businessType);
            business.setCreatedAt(LocalDateTime.now());
            Business savedBusiness = businessRepository.save(business);

            existingUser.setBusinessId(savedBusiness.getId());
            existingUser.setRole("ADMIN");
            existingUser.setGoogleSubject(googleSub);
            if (existingUser.getNotificationEmail() == null || existingUser.getNotificationEmail().isBlank()) {
                existingUser.setNotificationEmail(googleEmail);
            }
            if (existingUser.getAuthProvider() == null || existingUser.getAuthProvider().isBlank()) {
                existingUser.setAuthProvider("GOOGLE");
            }
            User savedUser = userRepository.save(existingUser);

            UserDetails userDetails = loadUserByUsername(savedUser.getEmail());
            String token = jwtService.generateToken(userDetails);

            return GoogleAuthResponse.builder()
                    .status("SUCCESS")
                    .token(token)
                    .user(mapToUserResponse(savedUser))
                    .message("Welcome to StockUp AI! Company account created successfully with Google.")
                    .build();
        }

        // CASE B — Brand new Google user
        if (request.getBusinessName() == null || request.getBusinessName().trim().isBlank()) {
            return GoogleAuthResponse.builder()
                    .status("BUSINESS_REQUIRED")
                    .email(googleEmail)
                    .name(googleName)
                    .message("Please enter your Pharmacy or Business Name to complete your StockUp AI account setup.")
                    .build();
        }

        String businessName = request.getBusinessName().trim();
        String businessType = (request.getBusinessType() != null && !request.getBusinessType().trim().isBlank())
                ? request.getBusinessType().trim()
                : "Hospital Pharmacy";

        String phone = (request.getPhone() != null) ? request.getPhone().trim() : "";
        String address = (request.getAddress() != null) ? request.getAddress().trim() : "";

        Business business = new Business();
        business.setBusinessName(businessName);
        business.setOwnerName(googleName);
        business.setEmail(googleEmail);
        business.setPhone(phone);
        business.setAddress(address);
        business.setBusinessType(businessType);
        business.setCreatedAt(LocalDateTime.now());
        Business savedBusiness = businessRepository.save(business);

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String randomUnusablePassword = encoder.encode(UUID.randomUUID().toString());

        User newUser = new User();
        newUser.setFullName(googleName);
        newUser.setEmail(googleEmail);
        newUser.setPhone(phone);
        newUser.setPassword(randomUnusablePassword);
        newUser.setRole("ADMIN");
        newUser.setBusinessId(savedBusiness.getId());
        newUser.setGoogleSubject(googleSub);
        newUser.setAuthProvider("GOOGLE");
        newUser.setNotificationEmail(googleEmail);
        newUser.setCreatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(newUser);

        UserDetails userDetails = loadUserByUsername(savedUser.getEmail());
        String token = jwtService.generateToken(userDetails);

        return GoogleAuthResponse.builder()
                .status("SUCCESS")
                .token(token)
                .user(mapToUserResponse(savedUser))
                .message("Welcome to StockUp AI! Company account created successfully with Google.")
                .build();
    }

    @Transactional
    @Override
    public void changePassword(ChangePasswordRequest request) {
        if (request == null || request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()
                || request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new IllegalArgumentException("Current password and new password are required.");
        }

        User currentUser = currentUserService.getCurrentUser();

        String rawCurrentPassword = request.getCurrentPassword().trim();
        String rawNewPassword = request.getNewPassword().trim();

        if (rawNewPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters.");
        }

        if (rawCurrentPassword.equals(rawNewPassword)) {
            throw new IllegalArgumentException("New password cannot be identical to current password.");
        }

        if (currentUser.getPassword() == null || !passwordEncoder.matches(rawCurrentPassword, currentUser.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        String encodedNewPassword = passwordEncoder.encode(rawNewPassword);
        currentUser.setPassword(encodedNewPassword);

        if (currentUser.getAuthProvider() == null || "GOOGLE".equalsIgnoreCase(currentUser.getAuthProvider())) {
            currentUser.setAuthProvider("BOTH");
        }

        userRepository.save(currentUser);
    }
}