package com.finance.importing.dto;

import com.finance.transaction.domain.TransactionType;
import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ImportRowResponse(
        Long id,
        int rowNumber,
        LocalDate date,
        String description,
        TransactionType type,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal amount,

        Long accountId,
        Long toAccountId,
        Long categoryId,
        String merchant,
        String note,

        String parseError,
        boolean duplicate,
        Long duplicateOfTransactionId,
        Long committedTransactionId
) {
}
