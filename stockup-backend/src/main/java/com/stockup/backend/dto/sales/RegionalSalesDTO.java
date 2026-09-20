package com.stockup.backend.dto.sales;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegionalSalesDTO {
    private String name; // region name or country name
    private String region;
    private long unitsSold;
    private double revenue;
    private double percentage;
}
