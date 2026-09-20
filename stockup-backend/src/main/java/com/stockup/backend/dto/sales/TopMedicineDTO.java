package com.stockup.backend.dto.sales;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopMedicineDTO {
    private String medicine;
    private String category;
    private long unitsSold;
    private double revenue;
    private double averagePrice;
    private double marketSharePercent;
}
