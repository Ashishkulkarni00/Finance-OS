package com.finance.decision.dto;

import com.finance.common.money.MoneySerializer;
import com.finance.decision.UnlockOption;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * One costed option for freed-up money (ROADMAP 4.4).
 *
 * <p>Fields are null by kind rather than split across three response types: the client
 * renders one list of comparable choices, and three shapes would push the job of knowing
 * which fields exist into every call site. {@code kind} is the discriminator.
 */
public record UnlockOptionResponse(
        String kind,
        Long targetId,
        String targetName,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal amount,

        /** LOAN only. */
        Integer clearsMonthsSooner,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal interestSaved,

        /** GOAL only. */
        LocalDate reachesOn,
        Integer reachesMonthsSooner,

        /** Why this one could not be costed. Null when it could. */
        String unknownReason
) {
    public static UnlockOptionResponse from(UnlockOption o) {
        return new UnlockOptionResponse(o.kind().name(), o.targetId(), o.targetName(), o.amount(),
                o.clearsMonthsSooner(), o.interestSaved(), o.reachesOn(), o.reachesMonthsSooner(),
                o.unknownReason());
    }

    public static List<UnlockOptionResponse> from(List<UnlockOption> options) {
        return options.stream().map(UnlockOptionResponse::from).toList();
    }
}
