package com.stockup.backend.service;

import com.stockup.backend.dto.BusinessRequest;
import com.stockup.backend.dto.BusinessResponse;
import org.springframework.lang.NonNull;

import java.util.List;

public interface BusinessService {

    BusinessResponse registerBusiness(BusinessRequest request);

    BusinessResponse getBusinessById(@NonNull String id);

    List<BusinessResponse> getAllBusinesses();

    BusinessResponse updateBusiness(@NonNull String id, BusinessRequest request);

    void deleteBusiness(@NonNull String id);

}