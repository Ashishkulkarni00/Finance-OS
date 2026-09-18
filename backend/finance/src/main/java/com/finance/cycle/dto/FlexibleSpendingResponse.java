package com.finance.cycle.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.util.List;

public record FlexibleSpendingResponse(
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal total,

        List<CategorySpendResponse> categories
) {
}
