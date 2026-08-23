package com.stockup.backend.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemImportResult {
    private int totalRecords;
    private int imported;
    private int updated;
    private int skipped;
    private List<String> errors;
}
