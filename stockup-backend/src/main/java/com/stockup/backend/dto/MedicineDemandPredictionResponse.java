package com.stockup.backend.dto;

/**
 * Response DTO for medicine hourly demand prediction.
 */
public class MedicineDemandPredictionResponse {

    private String productCode;
    private String latestTimestamp;
    private Double latestObservedDemand;
    private Double predictedNextHourDemand;

    public MedicineDemandPredictionResponse() {
    }

    public MedicineDemandPredictionResponse(String productCode,
                                            String latestTimestamp,
                                            Double latestObservedDemand,
                                            Double predictedNextHourDemand) {
        this.productCode = productCode;
        this.latestTimestamp = latestTimestamp;
        this.latestObservedDemand = latestObservedDemand;
        this.predictedNextHourDemand = predictedNextHourDemand;
    }

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
