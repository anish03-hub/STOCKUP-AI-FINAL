package com.stockup.backend.dto.forecast;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Individual daily forecast prediction point.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyForecastPointDTO {
    private String date;
    private Double predictedDemand;
    private Double lowerBound;
    private Double upperBound;
    private String dayOfWeek;
    private Boolean isWeekend;
}
