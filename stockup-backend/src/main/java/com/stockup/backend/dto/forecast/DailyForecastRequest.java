package com.stockup.backend.dto.forecast;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for daily demand forecasting.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyForecastRequest {

    @NotBlank(message = "Medicine name is required")
    private String medicine;

    @Min(value = 1, message = "Forecast days must be at least 1")
    @Max(value = 60, message = "Forecast days cannot exceed 60")
    @Builder.Default
    private Integer forecastDays = 7;

    private String country;
}
