package com.finance.position.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.util.List;

/**
 * Real Balance and Room - or, honestly, why they cannot be computed right now.
 *
 * <p>Modelled as one flat shape with a {@code state} discriminator rather than a Java
 * sealed hierarchy so the JSON matches {@code BACKEND_CONVENTIONS.md} §5's contract
 * exactly: {@code {"state":"INCOMPLETE","realBalance":null,"reason":...,"blockers":[...]}}.
 * The frontend's TypeScript union (`FRONTEND_CONVENTIONS.md` §5) is what actually makes
 * "render a number that isn't there" impossible - this is just the wire shape it reads.
 */
public record PositionResponse(

        /** {@code OK} or {@code INCOMPLETE}. Never a guess in between. */
        String state,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal realBalance,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal roomToday,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal roomLeft,

        /** What's already gone out today - "of ₹512 today · ₹222 spent". SCREEN_SPECS S1. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal spentToday,

        PositionBreakdown breakdown,

        /** Set only when {@code state} is {@code INCOMPLETE}. */
        String reason,
        List<Blocker> blockers
) {

    public static PositionResponse ok(BigDecimal realBalance, BigDecimal roomToday, BigDecimal roomLeft,
                                      BigDecimal spentToday, PositionBreakdown breakdown) {
        return new PositionResponse("OK", realBalance, roomToday, roomLeft, spentToday, breakdown, null, null);
    }

    public static PositionResponse incomplete(String reason, List<Blocker> blockers) {
        return new PositionResponse("INCOMPLETE", null, null, null, null, null, reason, blockers);
    }
}
