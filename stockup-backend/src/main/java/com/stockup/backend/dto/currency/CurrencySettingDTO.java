package com.stockup.backend.dto.currency;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrencySettingDTO {
    private String currency;
    private String baseCurrency;
    private Double exchangeRate;
    private String rateUpdatedAt;
    private String rateSource;
    private boolean cached;
}
