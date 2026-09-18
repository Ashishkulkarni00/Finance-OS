package com.finance.position.dto;

import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.util.List;

/**
 * Real Balance traceable to its source, in one call - Principle 2 as an API contract,
 * not a UI nicety. See {@code TECHNICAL_ARCHITECTURE.md} §4.
 */
public record PositionBreakdown(

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal held,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal reserved,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal committed,

        /** The optional-bill part of {@code committed} - money a skip would free. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal optionalCommitted,

        /** Owed on credit cards - spent already, paid later from held money. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal cardDues,

        List<AccountContribution> accounts,
        List<CommitmentContribution> commitments,

        /** Each card with something owed; {@code balance} is the positive amount owed. */
        List<AccountContribution> cards
) {
    public record AccountContribution(Long accountId, String name,
                                      @JsonSerialize(using = MoneySerializer.class) BigDecimal balance) {
    }

    public record CommitmentContribution(Long commitmentInstanceId, String name,
                                         @JsonSerialize(using = MoneySerializer.class) BigDecimal outstanding,
                                         boolean mandatory) {
    }
}
