package com.stockup.backend.dto.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentApplyRequestDTO {
    private String documentType; // optional override
    private List<Integer> selectedRowIndices; // optional subset of items to apply
    private Boolean allowDuplicateInvoice; // force override if admin explicitly confirms
}
