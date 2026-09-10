package com.stockup.backend.service;

import com.stockup.backend.dto.LoginResponse;
import com.stockup.backend.dto.RegisterRequest;
import com.stockup.backend.model.Business;
import com.stockup.backend.model.User;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.repository.UserRepository;
import com.stockup.backend.security.JwtService;
import com.stockup.backend.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    private RegisterRequest createValidCombinedRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Dr. Alice Sharma");
        request.setEmail("alice@centralhospital.com");
        request.setPhone("9876543210");
        request.setPassword("SecurePassword123!");
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
    public void testNewBusinessAndFirstUser_CreatesBusinessAndUserWithRoleAdmin() {
        RegisterRequest request = createValidCombinedRequest();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(request.getPhone())).thenReturn(Optional.empty());
        when(businessRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
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

        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("mock-jwt-token-123");

        LoginResponse response = userService.register(request);

        assertNotNull(response);
        assertEquals("mock-jwt-token-123", response.getToken());
        assertNotNull(response.getUser());
        assertEquals("user-uuid-5678", response.getUser().getId());
        assertEquals("ADMIN", response.getUser().getRole());
        assertEquals("bus-uuid-1234", response.getUser().getBusinessId());
        assertEquals("alice@centralhospital.com", response.getUser().getEmail());

        // Verify Business was saved with matching details
        ArgumentCaptor<Business> businessCaptor = ArgumentCaptor.forClass(Business.class);
        verify(businessRepository, times(1)).save(businessCaptor.capture());
        Business savedBusiness = businessCaptor.getValue();
        assertEquals("Central City Pharmacy", savedBusiness.getBusinessName());
        assertEquals("Dr. Alice Sharma", savedBusiness.getOwnerName());
        assertEquals("alice@centralhospital.com", savedBusiness.getEmail());
        assertEquals("9876543210", savedBusiness.getPhone());
        assertEquals("400001", savedBusiness.getPincode());

        // Verify User was saved with businessId
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("bus-uuid-1234", savedUser.getBusinessId());
        assertEquals("ADMIN", savedUser.getRole());
    }

    @Test
    public void testDuplicateUserEmail_ThrowsIllegalStateException() {
        RegisterRequest request = createValidCombinedRequest();
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(new User()));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> userService.register(request));
        assertEquals("Email already in use", ex.getMessage());

        verify(businessRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    public void testDuplicateUserPhone_ThrowsIllegalStateException() {
        RegisterRequest request = createValidCombinedRequest();
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(request.getPhone())).thenReturn(Optional.of(new User()));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> userService.register(request));
        assertEquals("Phone number already in use", ex.getMessage());

        verify(businessRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    public void testDuplicateBusinessEmail_ThrowsIllegalStateException() {
        RegisterRequest request = createValidCombinedRequest();
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(request.getPhone())).thenReturn(Optional.empty());
        when(businessRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(new Business()));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> userService.register(request));
        assertEquals("Business with this email already exists", ex.getMessage());

        verify(businessRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    public void testDuplicateBusinessPhone_ThrowsIllegalStateException() {
        RegisterRequest request = createValidCombinedRequest();
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(request.getPhone())).thenReturn(Optional.empty());
        when(businessRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(businessRepository.findByPhone(request.getPhone())).thenReturn(Optional.of(new Business()));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> userService.register(request));
        assertEquals("Business with this phone number already exists", ex.getMessage());

        verify(businessRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    public void testMissingBusinessInformation_ThrowsIllegalArgumentException() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("John Doe");
        request.setEmail("john@example.com");
        request.setPhone("9876543210");
        request.setPassword("SecurePassword123!");
        // No businessName, no businessId

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(request.getPhone())).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> userService.register(request));
        assertEquals("Business information is required", ex.getMessage());
    }
}
