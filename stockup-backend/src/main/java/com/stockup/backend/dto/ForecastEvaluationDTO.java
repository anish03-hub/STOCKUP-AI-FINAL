package com.stockup.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForecastEvaluationDTO {
    private String productCode;
    private String productName;
    private String modelName;
    private Double mape;          // Mean Absolute Percentage Error (%)
    private Double rmse;          // Root Mean Squared Error
    private Double mae;           // Mean Absolute Error
    private Double accuracyScore; // 100 - MAPE (%)
    private Integer sampleCount;
    private String evaluationPeriod;
    private List<ForecastEvaluationPointDTO> dataPoints;
}
