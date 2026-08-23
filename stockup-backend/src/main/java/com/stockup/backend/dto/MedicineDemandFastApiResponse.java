package com.stockup.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response payload returned by the FastAPI medicine demand endpoint.
 */
public class MedicineDemandFastApiResponse {

    @JsonProperty("product_code")
    private String productCode;

    @JsonProperty("latest_timestamp")
    private String latestTimestamp;

    @JsonProperty("latest_observed_demand")
    private Double latestObservedDemand;

    @JsonProperty("predicted_next_hour_demand")
    private Double predictedNextHourDemand;

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getLatestTimestamp() {
        return latestTimestamp;
    }

    public void setLatestTimestamp(String latestTimestamp) {
        this.latestTimestamp = latestTimestamp;
    }

    public Double getLatestObservedDemand() {
        return latestObservedDemand;
    }

    public void setLatestObservedDemand(Double latestObservedDemand) {
        this.latestObservedDemand = latestObservedDemand;
    }

    public Double getPredictedNextHourDemand() {
        return predictedNextHourDemand;
    }

    public void setPredictedNextHourDemand(Double predictedNextHourDemand) {
        this.predictedNextHourDemand = predictedNextHourDemand;
    }
}
