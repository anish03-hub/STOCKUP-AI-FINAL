package com.stockup.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request payload expected by the FastAPI medicine demand endpoint.
 */
public class MedicineDemandFastApiRequest {

    @JsonProperty("product_code")
    private String productCode;

    public MedicineDemandFastApiRequest() {
    }

    public MedicineDemandFastApiRequest(String productCode) {
        this.productCode = productCode;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }
}
