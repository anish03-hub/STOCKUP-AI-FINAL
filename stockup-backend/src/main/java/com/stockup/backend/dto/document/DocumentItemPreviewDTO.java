package com.stockup.backend.dto.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentItemPreviewDTO {
    private Integer rowIndex;
    private String medicineName;
    private String medicineCode;
    private String category;
    private String dosageForm;
    private Integer currentStock;
    private Integer quantityChange;
    private Integer newStock;
    private Double unitPrice;
    private Double totalPrice;
    private String action; // CREATE, UPDATE, DEDUCT_SALE, ADD_PURCHASE, REVIEW
    private String status; // MATCHED, NEW_MEDICINE, POTENTIAL_DUPLICATE, INSUFFICIENT_STOCK, WARNING
    private String warning;
    private String matchedItemId;
    private String matchedItemName;
    private String expiryDate;
    private String batchNumber;
}
