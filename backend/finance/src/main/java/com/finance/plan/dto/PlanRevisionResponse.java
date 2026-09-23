package com.finance.plan.dto;

import com.finance.common.money.MoneySerializer;
import com.finance.plan.domain.PlanRevisionType;
import com.finance.plan.domain.PlanSubjectType;
import com.finance.plan.domain.PlanValueKind;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record PlanRevisionResponse(
        Long id,
        PlanSubjectType subjectType,
        Long subjectId,
        String subjectName,
        PlanRevisionType revisionType,

        /** Whether the user made this call, or it followed a loan or holding. */
        boolean userDecision,

        /** The rule this one replaced, when the change was applied from a date. */
        Long supersededSubjectId,

        Instant decidedAt,
        LocalDate effectiveFrom,
        Long cycleId,

        /** The user's own words. Null when they did not give a reason - never invented. */
        String reason,

        /**
         * What this costs per month: positive means more money is needed each month.
         * Null means unknown (a commitment whose amount varies), never zero.
         */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal monthlyEffect,

        List<FieldChange> changes
) {

    /** One field that moved. {@code oldValue}/{@code newValue} are null when absent, not blank. */
    public record FieldChange(
            String field,
            String label,
            PlanValueKind valueKind,
            String oldValue,
            String newValue
    ) {
    }
}
