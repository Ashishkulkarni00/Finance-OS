package com.finance.cycle.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;

public record CategorySpendResponse(
        Long categoryId,
        String categoryName,
        String categoryGroup,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal amount,

        /** Fraction of the group total (0.38 means 38%), never pre-multiplied. Null when
         *  there is nothing to take a share of. */
        BigDecimal share
) {
}
