package com.stockup.backend.service;

import com.stockup.backend.dto.RegisterRequest;
import com.stockup.backend.dto.RegisterResponse;
import com.stockup.backend.model.Business;
import com.stockup.backend.model.User;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.repository.UserRepository;
import com.stockup.backend.security.GoogleTokenVerifierService;
import com.stockup.backend.security.JwtService;
import com.stockup.backend.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AuthenticationManager;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private CompanyOnboardingService companyOnboardingService;

    @Mock
    private GoogleTokenVerifierService googleTokenVerifierService;

    @Mock
    private com.stockup.backend.security.CurrentUserService currentUserService;

    @Mock
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    private RegisterRequest createValidCombinedRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Dr. Alice Sharma");
        request.setEmail("alicesharma");
        request.setPhone("9876543210");
        request.setPassword("SecurePassword123!");
        request.setConfirmPassword("SecurePassword123!");
        request.setBusinessName("Central City Pharmacy");
        request.setOwnerName("Dr. Alice Sharma");
        request.setBusinessType("Hospital Pharmacy");
        request.setAddress("123 Healthcare Ave");
        request.setCity("Mumbai");
        request.setState("Maharashtra");
        request.setCountry("India");
        request.setPincode("400001");
        return request;
    }

    @Test
    public void testNewCompanyAndFirstUser_CreatesBusinessAndAdminUserWithStockupDomain() {
        RegisterRequest request = createValidCombinedRequest();
        String expectedEmail = "alicesharma@stockupai.in";

        when(userRepository.findByEmail(expectedEmail)).thenReturn(Optional.empty());
        when(userRepository.findByPhone(request.getPhone())).thenReturn(Optional.empty());
        when(businessRepository.findByEmail(expectedEmail)).thenReturn(Optional.empty());
        when(businessRepository.findByPhone(request.getPhone())).thenReturn(Optional.empty());

        when(businessRepository.save(any(Business.class))).thenAnswer(invocation -> {
            Business b = invocation.getArgument(0);
            b.setId("bus-uuid-1234");
            return b;
        });

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId("user-uuid-5678");
            return u;
        });

        RegisterResponse response = userService.register(request);

        assertNotNull(response);
        assertEquals("Company account created successfully", response.getMessage());
        assertNotNull(response.getUser());
        assertEquals("user-uuid-5678", response.getUser().getId());
        assertEquals("ADMIN", response.getUser().getRole());
        assertEquals("bus-uuid-1234", response.getUser().getBusinessId());
        assertEquals("alicesharma@stockupai.in", response.getUser().getEmail());

        assertNotNull(response.getBusiness());
        assertEquals("bus-uuid-1234", response.getBusiness().getId());
        assertEquals("Central City Pharmacy", response.getBusiness().getBusinessName());
        assertEquals("alicesharma@stockupai.in", response.getBusiness().getEmail());

        // Verify Business was saved with matching details
        ArgumentCaptor<Business> businessCaptor = ArgumentCaptor.forClass(Business.class);
        verify(businessRepository, times(1)).save(businessCaptor.capture());
        Business savedBusiness = businessCaptor.getValue();
        assertEquals("Central City Pharmacy", savedBusiness.getBusinessName());
        assertEquals("Dr. Alice Sharma", savedBusiness.getOwnerName());
        assertEquals("alicesharma@stockupai.in", savedBusiness.getEmail());
        assertEquals("9876543210", savedBusiness.getPhone());
        assertEquals("400001", savedBusiness.getPincode());

        // Verify User was saved with businessId and ADMIN role
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("bus-uuid-1234", savedUser.getBusinessId());
        assertEquals("ADMIN", savedUser.getRole());
        assertEquals("alicesharma@stockupai.in", savedUser.getEmail());
    }

    @Test
    public void testPasswordMismatch_ThrowsIllegalArgumentException() {
        RegisterRequest request = createValidCombinedRequest();
        request.setConfirmPassword("DifferentPassword123!");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> userService.register(request));
        assertEquals("Passwords do not match.", ex.getMessage());

        verify(businessRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    public void testInvalidEmailFormat_ThrowsIllegalArgumentException() {
        RegisterRequest request = createValidCombinedRequest();
        request.setEmail("user@invalid-domain");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> userService.register(request));
        assertEquals("Please enter a valid email address.", ex.getMessage());

        verify(businessRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    public void testDuplicateUserEmail_ThrowsIllegalStateException() {
        RegisterRequest request = createValidCombinedRequest();
        String expectedEmail = "alicesharma@stockupai.in";
        when(userRepository.findByEmail(expectedEmail)).thenReturn(Optional.of(new User()));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> userService.register(request));
        assertEquals("Company email is already registered.", ex.getMessage());

        verify(businessRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    public void testDuplicateUserPhone_ThrowsIllegalStateException() {
        RegisterRequest request = createValidCombinedRequest();
        String expectedEmail = "alicesharma@stockupai.in";
        when(userRepository.findByEmail(expectedEmail)).thenReturn(Optional.empty());
        when(businessRepository.findByEmail(expectedEmail)).thenReturn(Optional.empty());
        when(userRepository.findByPhone(request.getPhone())).thenReturn(Optional.of(new User()));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> userService.register(request));
        assertEquals("Phone number already in use", ex.getMessage());

        verify(businessRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    public void testDuplicateBusinessEmail_ThrowsIllegalStateException() {
        RegisterRequest request = createValidCombinedRequest();
        String expectedEmail = "alicesharma@stockupai.in";
        when(userRepository.findByEmail(expectedEmail)).thenReturn(Optional.empty());
        when(businessRepository.findByEmail(expectedEmail)).thenReturn(Optional.of(new Business()));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> userService.register(request));
        assertEquals("Company email is already registered.", ex.getMessage());

        verify(businessRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    public void testDuplicateBusinessPhone_ThrowsIllegalStateException() {
        RegisterRequest request = createValidCombinedRequest();
        String expectedEmail = "alicesharma@stockupai.in";
        when(userRepository.findByEmail(expectedEmail)).thenReturn(Optional.empty());
        when(businessRepository.findByEmail(expectedEmail)).thenReturn(Optional.empty());
        when(userRepository.findByPhone(request.getPhone())).thenReturn(Optional.empty());
        when(businessRepository.findByPhone(request.getPhone())).thenReturn(Optional.of(new Business()));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> userService.register(request));
        assertEquals("Phone number already in use", ex.getMessage());

        verify(businessRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    public void testMissingBusinessInformation_ThrowsIllegalArgumentException() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("John Doe");
        request.setEmail("johndoe");
        request.setPhone("9876543210");
        request.setPassword("SecurePassword123!");
        request.setConfirmPassword("SecurePassword123!");
        // No businessName, no businessId

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> userService.register(request));
        assertEquals("Business information is required", ex.getMessage());
    }

    @Test
    public void testAuthenticateGoogleUser_ExistingUser_ReturnsSuccessWithJwt() {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload =
                new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();
        payload.setSubject("google-sub-12345");
        payload.setEmail("doctor@hospital.com");
        payload.set("name", "Dr. Google Admin");

        when(googleTokenVerifierService.verifyToken("valid-token")).thenReturn(payload);

        User existingUser = new User();
        existingUser.setId("usr-111");
        existingUser.setEmail("doctor@hospital.com");
        existingUser.setPassword("$2a$10$e7V2n3/V81eK72.2.82.2u");
        existingUser.setGoogleSubject("google-sub-12345");
        existingUser.setBusinessId("bus-999");
        existingUser.setRole("ADMIN");

        Business existingBusiness = new Business();
        existingBusiness.setId("bus-999");
        existingBusiness.setBusinessName("Existing Pharmacy");

        when(userRepository.findByGoogleSubject("google-sub-12345")).thenReturn(Optional.of(existingUser));
        when(userRepository.findByEmail("doctor@hospital.com")).thenReturn(Optional.of(existingUser));
        when(businessRepository.findById("bus-999")).thenReturn(Optional.of(existingBusiness));
        when(jwtService.generateToken(any())).thenReturn("jwt-mock-token-xyz");

        com.stockup.backend.dto.GoogleAuthRequest authReq = new com.stockup.backend.dto.GoogleAuthRequest();
        authReq.setCredential("valid-token");

        com.stockup.backend.dto.GoogleAuthResponse response = userService.authenticateGoogleUser(authReq);

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals("jwt-mock-token-xyz", response.getToken());
        assertNotNull(response.getUser());
        assertEquals("usr-111", response.getUser().getId());
    }

    @Test
    public void testAuthenticateGoogleUser_DanglingBusinessNoOnboarding_ReturnsBusinessRequired() {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload =
                new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();
        payload.setSubject("google-sub-dangling");
        payload.setEmail("dangling@hospital.com");
        payload.set("name", "Dangling Google User");

        when(googleTokenVerifierService.verifyToken("dangling-token")).thenReturn(payload);

        User danglingUser = new User();
        danglingUser.setId("usr-dangling-123");
        danglingUser.setEmail("dangling@hospital.com");
        danglingUser.setPassword("$2a$10$e7V2n3/V81eK72.2.82.2u");
        danglingUser.setGoogleSubject("google-sub-dangling");
        danglingUser.setBusinessId("45haih");
        danglingUser.setRole("ADMIN");

        when(userRepository.findByGoogleSubject("google-sub-dangling")).thenReturn(Optional.of(danglingUser));
        when(businessRepository.findById("45haih")).thenReturn(Optional.empty());

        com.stockup.backend.dto.GoogleAuthRequest authReq = new com.stockup.backend.dto.GoogleAuthRequest();
        authReq.setCredential("dangling-token");

        com.stockup.backend.dto.GoogleAuthResponse response = userService.authenticateGoogleUser(authReq);

        assertNotNull(response);
        assertEquals("BUSINESS_REQUIRED", response.getStatus());
        assertEquals("dangling@hospital.com", response.getEmail());
    }

    @Test
    public void testAuthenticateGoogleUser_DanglingBusinessWithOnboarding_CreatesNewBusinessAndUpdatesUser() {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload =
                new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();
        payload.setSubject("google-sub-dangling");
        payload.setEmail("dangling@hospital.com");
        payload.set("name", "Dangling Google User");

        when(googleTokenVerifierService.verifyToken("dangling-token-submit")).thenReturn(payload);

        User danglingUser = new User();
        danglingUser.setId("usr-dangling-123");
        danglingUser.setEmail("dangling@hospital.com");
        danglingUser.setPassword("$2a$10$e7V2n3/V81eK72.2.82.2u");
        danglingUser.setGoogleSubject("google-sub-dangling");
        danglingUser.setBusinessId("45haih");
        danglingUser.setRole("ADMIN");

        when(userRepository.findByGoogleSubject("google-sub-dangling")).thenReturn(Optional.of(danglingUser));
        when(businessRepository.findById("45haih")).thenReturn(Optional.empty());

        when(businessRepository.save(any(Business.class))).thenAnswer(inv -> {
            Business b = inv.getArgument(0);
            b.setId("new-bus-uuid-999");
            return b;
        });

        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findByEmail("dangling@hospital.com")).thenReturn(Optional.of(danglingUser));
        when(jwtService.generateToken(any())).thenReturn("jwt-mock-dangling-success");

        com.stockup.backend.dto.GoogleAuthRequest authReq = new com.stockup.backend.dto.GoogleAuthRequest();
        authReq.setCredential("dangling-token-submit");
        authReq.setBusinessName("StockUp Pharmacy");

        com.stockup.backend.dto.GoogleAuthResponse response = userService.authenticateGoogleUser(authReq);

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals("jwt-mock-dangling-success", response.getToken());
        assertNotNull(response.getUser());
        assertEquals("usr-dangling-123", response.getUser().getId());
        assertEquals("new-bus-uuid-999", response.getUser().getBusinessId());
        assertEquals("ADMIN", response.getUser().getRole());
    }

    @Test
    public void testAuthenticateGoogleUser_NewUserNoBusiness_ReturnsBusinessRequired() {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload =
                new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();
        payload.setSubject("google-sub-67890");
        payload.setEmail("newuser@hospital.com");
        payload.set("name", "Dr. New User");

        when(googleTokenVerifierService.verifyToken("valid-token-new")).thenReturn(payload);
        when(userRepository.findByGoogleSubject("google-sub-67890")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("newuser@hospital.com")).thenReturn(Optional.empty());

        com.stockup.backend.dto.GoogleAuthRequest authReq = new com.stockup.backend.dto.GoogleAuthRequest();
        authReq.setCredential("valid-token-new");

        com.stockup.backend.dto.GoogleAuthResponse response = userService.authenticateGoogleUser(authReq);

        assertNotNull(response);
        assertEquals("BUSINESS_REQUIRED", response.getStatus());
        assertEquals("newuser@hospital.com", response.getEmail());
    }

    @Test
    public void testAuthenticateGoogleUser_NewUserWithBusiness_CreatesBusinessAndUser() {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload =
                new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();
        payload.setSubject("google-sub-67890");
        payload.setEmail("newuser@hospital.com");
        payload.set("name", "Dr. New User");

        when(googleTokenVerifierService.verifyToken("valid-token-new")).thenReturn(payload);
        when(userRepository.findByGoogleSubject("google-sub-67890")).thenReturn(Optional.empty());

        when(businessRepository.save(any(Business.class))).thenAnswer(inv -> {
            Business b = inv.getArgument(0);
            b.setId("new-bus-id");
            return b;
        });

        User createdUser = new User();
        createdUser.setId("new-usr-id");
        createdUser.setEmail("newuser@hospital.com");
        createdUser.setPassword("$2a$10$e7V2n3/V81eK72.2.82.2u");
        createdUser.setRole("ADMIN");
        createdUser.setBusinessId("new-bus-id");

        when(userRepository.save(any(User.class))).thenReturn(createdUser);
        when(userRepository.findByEmail("newuser@hospital.com"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(createdUser));

        when(jwtService.generateToken(any())).thenReturn("jwt-mock-new-token");

        com.stockup.backend.dto.GoogleAuthRequest authReq = new com.stockup.backend.dto.GoogleAuthRequest();
        authReq.setCredential("valid-token-new");
        authReq.setBusinessName("New City Pharmacy");
        authReq.setBusinessType("Hospital Pharmacy");
        authReq.setPhone("+91 99999 88888");

        com.stockup.backend.dto.GoogleAuthResponse response = userService.authenticateGoogleUser(authReq);

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals("jwt-mock-new-token", response.getToken());
        assertNotNull(response.getUser());
        assertEquals("new-usr-id", response.getUser().getId());
        assertEquals("ADMIN", response.getUser().getRole());
    }

    @Test
    public void testLogin_ValidEmailAndPassword_ReturnsTokenAndUserResponse() {
        User user = new User();
        user.setId("usr-ag-123");
        user.setEmail("ag584160@gmail.com");
        user.setFullName("Anish Sah");
        user.setRole("ADMIN");
        user.setBusinessId("biz-target-456");
        user.setAuthProvider("BOTH");

        org.springframework.security.core.Authentication mockAuth = mock(org.springframework.security.core.Authentication.class);
        org.springframework.security.core.userdetails.UserDetails mockDetails = 
                org.springframework.security.core.userdetails.User.builder()
                        .username("ag584160@gmail.com")
                        .password("encoded-pass")
                        .roles("ADMIN")
                        .build();

        when(mockAuth.getPrincipal()).thenReturn(mockDetails);
        when(authenticationManager.authenticate(any())).thenReturn(mockAuth);
        when(userRepository.findByEmailIgnoreCase("ag584160@gmail.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any())).thenReturn("mock-valid-jwt");

        com.stockup.backend.dto.LoginRequest req = new com.stockup.backend.dto.LoginRequest();
        req.setEmail("  AG584160@gmail.com  ");
        req.setPassword("Password123!");

        com.stockup.backend.dto.LoginResponse response = userService.login(req);

        assertNotNull(response);
        assertEquals("mock-valid-jwt", response.getToken());
        assertNotNull(response.getUser());
        assertEquals("usr-ag-123", response.getUser().getId());
        assertEquals("ag584160@gmail.com", response.getUser().getEmail());
        assertEquals("BOTH", response.getUser().getAuthProvider());
        assertEquals("biz-target-456", response.getUser().getBusinessId());
    }

    @Test
    public void testLogin_InvalidPassword_ThrowsBadCredentialsException() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new org.springframework.security.authentication.BadCredentialsException("Invalid credentials"));

        com.stockup.backend.dto.LoginRequest req = new com.stockup.backend.dto.LoginRequest();
        req.setEmail("ag584160@gmail.com");
        req.setPassword("WrongPassword!");

        assertThrows(org.springframework.security.authentication.BadCredentialsException.class, () -> {
            userService.login(req);
        });
    }

    @Test
    public void testLogin_UnknownEmail_ThrowsException() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new org.springframework.security.authentication.BadCredentialsException("User not found"));

        com.stockup.backend.dto.LoginRequest req = new com.stockup.backend.dto.LoginRequest();
        req.setEmail("nonexistent@example.com");
        req.setPassword("Password123!");

        assertThrows(org.springframework.security.authentication.BadCredentialsException.class, () -> {
            userService.login(req);
        });
    }

    @Test
    public void testChangePassword_ValidCurrentAndNewPassword_UpdatesPassword() {
        User currentUser = new User();
        currentUser.setId("usr-123");
        currentUser.setEmail("ag584160@gmail.com");
        currentUser.setPassword("encoded-old-password");
        currentUser.setAuthProvider("BOTH");

        when(currentUserService.getCurrentUser()).thenReturn(currentUser);
        when(passwordEncoder.matches("OldPassword123!", "encoded-old-password")).thenReturn(true);
        when(passwordEncoder.encode("NewPassword123!")).thenReturn("encoded-new-password");

        com.stockup.backend.dto.ChangePasswordRequest req = 
                new com.stockup.backend.dto.ChangePasswordRequest("OldPassword123!", "NewPassword123!");

        userService.changePassword(req);

        assertEquals("encoded-new-password", currentUser.getPassword());
        verify(userRepository, times(1)).save(currentUser);
    }

    @Test
    public void testChangePassword_WrongCurrentPassword_ThrowsException() {
        User currentUser = new User();
        currentUser.setId("usr-123");
        currentUser.setPassword("encoded-old-password");

        when(currentUserService.getCurrentUser()).thenReturn(currentUser);
        when(passwordEncoder.matches("WrongPassword!", "encoded-old-password")).thenReturn(false);

        com.stockup.backend.dto.ChangePasswordRequest req = 
                new com.stockup.backend.dto.ChangePasswordRequest("WrongPassword!", "NewPassword123!");

        Exception exc = assertThrows(IllegalArgumentException.class, () -> {
            userService.changePassword(req);
        });
        assertEquals("Current password is incorrect.", exc.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    public void testChangePassword_NewPasswordTooShort_ThrowsException() {
        com.stockup.backend.dto.ChangePasswordRequest req = 
                new com.stockup.backend.dto.ChangePasswordRequest("OldPassword123!", "short");

        Exception exc = assertThrows(IllegalArgumentException.class, () -> {
            userService.changePassword(req);
        });
        assertEquals("New password must be at least 8 characters.", exc.getMessage());
    }

    @Test
    public void testChangePassword_SameCurrentAndNewPassword_ThrowsException() {
        com.stockup.backend.dto.ChangePasswordRequest req = 
                new com.stockup.backend.dto.ChangePasswordRequest("Password123!", "Password123!");

        Exception exc = assertThrows(IllegalArgumentException.class, () -> {
            userService.changePassword(req);
        });
        assertEquals("New password cannot be identical to current password.", exc.getMessage());
    }
}


