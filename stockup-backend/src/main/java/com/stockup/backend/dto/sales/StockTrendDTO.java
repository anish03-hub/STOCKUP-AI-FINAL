package com.stockup.backend.dto.sales;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTrendDTO {
    private String period; // e.g. "2024-03" or "2024-03-15"
    private String medicine;
    private double avgStockLevel;
    private long unitsSold;
    private double avgExpiryDaysRemaining;
}
