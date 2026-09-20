package com.stockup.backend.dto.sales;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesTrendDTO {
    private String period; // e.g. "2024-03" or "2024-03-15" or "2024"
    private long unitsSold;
    private double revenue;
    private double averagePrice;
    private long transactionCount;
}
