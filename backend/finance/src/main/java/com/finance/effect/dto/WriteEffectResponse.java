package com.finance.effect.dto;

import com.finance.common.money.MoneySerializer;
import com.finance.effect.WriteEffect;
import com.finance.insight.dto.InsightListResponse;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.util.List;

/**
 * What a write just did, on the wire (ADR-0017).
 *
 * <p>Added <strong>beside</strong> each existing response rather than wrapping it. An
 * envelope would have been tidier and would have invalidated every response shape, every
 * frontend call site and every saved Postman example for a cosmetic gain. With
 * {@code non_null} serialisation, an absent effect costs nothing on the wire - and absent is
 * the correct answer whenever nothing moved.
 *
 * <p>A null figure means <strong>unknown</strong>, never zero: position refuses to compute
 * while a mandatory commitment has no amount (ADR-0006).
 *
 * @param prominence HELD when something needs acknowledging, QUIET otherwise
 */
public record WriteEffectResponse(
        @JsonSerialize(using = MoneySerializer.class) BigDecimal leftTodayBefore,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal leftTodayAfter,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal realBalanceBefore,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal realBalanceAfter,
        List<InsightListResponse.Item> started,
        List<Cleared> cleared,
        int moreStarted,
        int moreCleared,
        WriteEffect.Prominence prominence
) {

    /** A warning that has just stopped being true. Only what was said and what it was
     *  about - a cleared warning has no action left to offer. */
    public record Cleared(String key, String title) {
    }

    public static WriteEffectResponse from(WriteEffect effect) {
        if (effect == null) {
            return null;
        }
        return new WriteEffectResponse(
                effect.leftTodayBefore(), effect.leftTodayAfter(),
                effect.realBalanceBefore(), effect.realBalanceAfter(),
                effect.started().stream().map(InsightListResponse::item).toList(),
                effect.cleared().stream().map(s -> new Cleared(s.getInsightKey(), s.getTitle())).toList(),
                effect.moreStarted(), effect.moreCleared(), effect.prominence());
    }
}
