package com.finance.decision;

import com.finance.goal.GoalFeasibility;

import java.math.BigDecimal;

/**
 * One place a lump sum could go, with what it does there - ROADMAP 4.3.
 *
 * <p>Each kind is measured in its own unit and they are never ranked against each other:
 * prepaying is rupees of interest and months; a goal is whether it then fits; keeping it is
 * the months of must-pay bills it covers. The exchange rate between those belongs to the
 * person (the same refusal as {@link UnlockOption}).
 *
 * @param applied           how much of the sum this option can actually absorb - prepaying more
 *                          than a loan owes, or saving more than a goal needs, is not possible
 * @param closesLoan        PREPAY: the sum clears the loan outright
 * @param emiFreed          PREPAY: when the loan closes, the EMI that stops leaving every month
 * @param goalBefore        GOAL: the goal's verdict today
 * @param goalAfter         GOAL: its verdict with the sum in it
 * @param runwayMonthsAfter how many months of must-pay bills the reachable money covers after
 *                          this choice; null when runway is unknown
 * @param unknownReason     why this option could not be fully costed
 */
public record LumpSumOption(
        Kind kind,
        Long targetId,
        String targetName,
        BigDecimal applied,

        Integer clearsMonthsSooner,
        BigDecimal interestSaved,
        boolean closesLoan,
        BigDecimal emiFreed,
        BigDecimal annualRate,

        GoalFeasibility.State goalBefore,
        GoalFeasibility.State goalAfter,
        String goalAfterReason,

        BigDecimal runwayMonthsAfter,
        String unknownReason
) {
    public enum Kind { PREPAY, GOAL, KEEP }
}
