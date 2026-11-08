package com.finance.decision.dto;

import com.finance.common.money.MoneySerializer;
import com.finance.decision.AffordabilityResult;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * The cost of a spend, before it happens.
 *
 * <p>Flat and discriminated on {@code state}, like {@code PositionResponse}, so the client
 * can narrow on it and make "render a figure that isn't there" a compile error
 * (BACKEND_CONVENTIONS §5). Every money field is null on {@code INCOMPLETE}, and
 * {@code reason} carries the sentence to show instead.
 */
public record AffordabilityResponse(
        String state,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal amount,
        Long accountId,
        String accountName,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal freeBefore,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal freeAfter,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal perDayBefore,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal perDayAfter,
        int daysToSalary,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal accountBalanceBefore,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal accountBalanceAfter,

        /** The first dated payment this spend would leave uncovered. Null when none. */
        String shortfallName,
        LocalDate shortfallOn,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal shortBy,

        String reason
) {
    public static AffordabilityResponse from(AffordabilityResult r) {
        return new AffordabilityResponse(
                r.state().name(), r.amount(), r.accountId(), r.accountName(),
                r.freeBefore(), r.freeAfter(), r.perDayBefore(), r.perDayAfter(), r.daysToSalary(),
                r.accountBalanceBefore(), r.accountBalanceAfter(),
                r.shortfallName(), r.shortfallOn(), r.shortBy(), r.reason());
    }
}
