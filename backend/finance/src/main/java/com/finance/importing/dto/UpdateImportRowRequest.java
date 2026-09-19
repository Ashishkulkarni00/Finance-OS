package com.finance.importing.dto;

import com.finance.transaction.domain.TransactionType;
import jakarta.validation.constraints.Size;

/**
 * Fix a staged row before it's imported - what kind of entry it is, its category, where a
 * transfer went, or its description. Omitted fields are unchanged.
 */
public record UpdateImportRowRequest(
        TransactionType type,
        Long categoryId,
        Boolean clearCategory,
        Long toAccountId,
        @Size(max = 200, message = "Description can be at most 200 characters")
        String description
) {
}
