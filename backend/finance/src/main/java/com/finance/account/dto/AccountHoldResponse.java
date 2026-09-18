package com.finance.account.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.util.List;

/** The workings behind {@code available} - see {@code com.finance.account.AccountHold}. */
public record AccountHoldResponse(
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal reserved,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal minimumHold,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal locked,

        List<String> reservedFor
) {
}
