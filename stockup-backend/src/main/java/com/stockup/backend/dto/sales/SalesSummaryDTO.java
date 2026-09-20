package com.stockup.backend.dto.sales;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesSummaryDTO {
    private String businessName;
    private long totalUnitsSold;
    private double totalRevenue;
    private double averageUnitPrice;
    private long totalTransactions;
    private long activeMedicines;
    private long countriesCovered;
    private long regionsCovered;
    private LocalDate startDate;
    private LocalDate endDate;
}
