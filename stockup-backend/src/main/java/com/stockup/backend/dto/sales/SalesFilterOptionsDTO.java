package com.stockup.backend.dto.sales;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesFilterOptionsDTO {
    private List<String> medicines;
    private List<String> countries;
    private List<String> regions;
    private List<String> categories;
    private List<String> ageGroups;
    private LocalDate minDate;
    private LocalDate maxDate;
    private long totalRecords;
}
