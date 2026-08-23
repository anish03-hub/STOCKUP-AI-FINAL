package com.stockup.backend.controller;

import com.stockup.backend.dto.BusinessRequest;
import com.stockup.backend.dto.BusinessResponse;
import com.stockup.backend.service.BusinessService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;

import java.util.List;

@RestController
@RequestMapping("/api/business")
@AllArgsConstructor
public class BusinessController {

    private final BusinessService businessService;

    @PostMapping("/register")
    public ResponseEntity<BusinessResponse> registerBusiness(@Valid @RequestBody BusinessRequest request) {
        BusinessResponse response = businessService.registerBusiness(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<BusinessResponse>> getAllBusinesses() {
        List<BusinessResponse> businesses = businessService.getAllBusinesses();
        return new ResponseEntity<>(businesses, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusinessResponse> getBusinessById(@PathVariable @NonNull String id) {
        BusinessResponse response = businessService.getBusinessById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusinessResponse> updateBusiness(@PathVariable @NonNull String id, @Valid @RequestBody BusinessRequest request) {
        BusinessResponse response = businessService.updateBusiness(id, request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBusiness(@PathVariable @NonNull String id) {
        businessService.deleteBusiness(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}