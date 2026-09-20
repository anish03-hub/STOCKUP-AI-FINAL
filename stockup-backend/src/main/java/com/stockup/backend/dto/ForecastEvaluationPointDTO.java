package com.stockup.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForecastEvaluationPointDTO {
    private String timestamp;
    private String formattedDate;
    private Double predicted;
    private Double actual;
    private Double absoluteError;
    private Double percentageError;
}
