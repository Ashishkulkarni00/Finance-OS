package com.finance.transaction.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;

/** See {@code com.finance.transaction.TransactionViewSummary}. */
public record TransactionViewSummaryResponse(
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal moneyIn,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal moneyOut,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal transferred,

        int entryCount
) {
}
