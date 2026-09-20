package com.stockup.backend.dto.sales;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CovidAnalysisDTO {
    private String period; // "COVID Period (Flagged)" vs "Non-COVID Period"
    private boolean covidFlag;
    private long unitsSold;
    private double revenue;
    private double avgUnitsPerDay;
    private long transactionCount;
    private double averageUnitPrice;
}
