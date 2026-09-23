package com.finance.plan;

import java.math.BigDecimal;
import java.util.List;

/**
 * What changed about the plan during one cycle - the answer to "why does this month look
 * different?".
 *
 * @param decisions        changes the user made themselves
 * @param followedSources  changes that followed a loan or holding ({@code SYNCED})
 * @param netMonthlyEffect what the cycle's decisions did to the monthly cash requirement:
 *                         positive means more is needed each month. <strong>Null when any
 *                         one decision's effect is unknown</strong> - a total that quietly
 *                         drops the unknowns would be a confident wrong answer (ADR-0006).
 */
public record CyclePlanChanges(
        Long cycleId,
        List<PlanRevisionView> revisions,
        int decisions,
        int followedSources,
        BigDecimal netMonthlyEffect,
        boolean effectComplete
) {
}
