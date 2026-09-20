package com.stockup.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderSummaryDTO {
    private long totalOrders;
    private long submittedOrders;
    private long receivedOrders;
    private long draftOrders;
    private long cancelledOrders;
    private double totalSpend;
}
