package com.finance.card.dto;

import com.finance.card.domain.CardNetwork;
import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;

public record CreditCardTermsResponse(
        Long id,
        Long accountId,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal creditLimit,

        int statementDay,
        int dueDay,
        CardNetwork network,
        Long payFromAccountId,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal outstanding,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal unbilled,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal availableCredit
) {
}
