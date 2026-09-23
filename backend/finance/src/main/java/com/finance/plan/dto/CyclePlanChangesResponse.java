package com.finance.plan.dto;

import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.util.List;

/** What changed about the plan during one cycle. */
public record CyclePlanChangesResponse(
        Long cycleId,
        List<PlanRevisionResponse> revisions,

        /** How many of them the user decided, as against followed from a loan or holding. */
        int decisions,
        int followedSources,

        /**
         * What the cycle's changes did to the monthly cash requirement. Null when any one
         * effect is unknown - a total with the unknowns quietly dropped would read as a
         * fact (ADR-0006). {@code effectComplete} says which case this is.
         */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal netMonthlyEffect,

        boolean effectComplete
) {
}
