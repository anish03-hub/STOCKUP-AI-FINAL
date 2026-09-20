package com.stockup.backend.service.impl;

import com.stockup.backend.dto.BusinessRequest;
import com.stockup.backend.dto.BusinessResponse;
import com.stockup.backend.model.Business;
import com.stockup.backend.repository.BusinessRepository;
import com.stockup.backend.service.BusinessService;
import com.stockup.backend.service.CompanyOnboardingService;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BusinessServiceImpl implements BusinessService {

    private final BusinessRepository businessRepository;
    private final CompanyOnboardingService companyOnboardingService;

    public BusinessServiceImpl(BusinessRepository businessRepository, CompanyOnboardingService companyOnboardingService) {
        this.businessRepository = businessRepository;
        this.companyOnboardingService = companyOnboardingService;
    }

    @Override
    public BusinessResponse registerBusiness(BusinessRequest request) {
        // Check if email already exists
        if (businessRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already in use");
        }
        // Check if phone already exists
        if (businessRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalStateException("Phone number already in use");
        }

        Business business = new Business();
        business.setBusinessName(request.getBusinessName());
        business.setOwnerName(request.getOwnerName());
        business.setEmail(request.getEmail());
        business.setPhone(request.getPhone());
        business.setBusinessType(request.getBusinessType());
        business.setAddress(request.getAddress());
        business.setCity(request.getCity());
        business.setState(request.getState());
        business.setCountry(request.getCountry());
        business.setPincode(request.getPincode());
        business.setCreatedAt(LocalDateTime.now());

        Business savedBusiness = businessRepository.save(business);
        if (savedBusiness != null) {
            companyOnboardingService.ensureCompanyCatalogInitialized(savedBusiness.getId(), savedBusiness.getBusinessName());
        }
        return mapToResponse(savedBusiness);
    }

    @Override
    public BusinessResponse getBusinessById(@NonNull String id) {
        Business business = businessRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Business not found with id: " + id));
        return mapToResponse(business);
    }

    @Override
    public List<BusinessResponse> getAllBusinesses() {
        List<Business> businesses = businessRepository.findAll();
        return businesses.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BusinessResponse updateBusiness(@NonNull String id, BusinessRequest request) {
        Business existingBusiness = businessRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Business not found with id: " + id));

        // Check if email is being updated and already exists for another business
        if (!existingBusiness.getEmail().equalsIgnoreCase(request.getEmail()) &&
                businessRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already in use");
        }
        // Check if phone is being updated and already exists for another business
        if (!existingBusiness.getPhone().equals(request.getPhone()) &&
                businessRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalStateException("Phone number already in use");
        }

        existingBusiness.setBusinessName(request.getBusinessName());
        existingBusiness.setOwnerName(request.getOwnerName());
        existingBusiness.setEmail(request.getEmail());
        existingBusiness.setPhone(request.getPhone());
        existingBusiness.setBusinessType(request.getBusinessType());
        existingBusiness.setAddress(request.getAddress());
        existingBusiness.setCity(request.getCity());
        existingBusiness.setState(request.getState());
        existingBusiness.setCountry(request.getCountry());
        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            existingBusiness.setCurrency(request.getCurrency());
        }
        // createdAt remains unchanged

        Business updatedBusiness = businessRepository.save(existingBusiness);
        return mapToResponse(updatedBusiness);
    }

    @Override
    public void deleteBusiness(@NonNull String id) {
        if (!businessRepository.existsById(id)) {
            throw new IllegalStateException("Business not found with id: " + id);
        }
        businessRepository.deleteById(id);
    }

    private BusinessResponse mapToResponse(Business business) {
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
}