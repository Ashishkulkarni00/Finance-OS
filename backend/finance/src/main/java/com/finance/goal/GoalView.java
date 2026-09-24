package com.finance.goal;

import com.finance.goal.domain.Goal;

import java.math.BigDecimal;
import java.util.List;

/**
 * @param currentAmount      saved: what's in the linked account or reservation now
 * @param spentAmount        already paid out of the goal through its planned payments
 * @param progressPercent    (saved + spent) against the target - paying a booking early
 *                           doesn't move a goal backwards
 * @param requiredPerMonth   set by the tightest deadline in {@code schedule}, not only the goal date
 * @param fundedPerMonth     what the plan actually puts into this goal each month, from the
 *                           bills that fund it. <strong>Null means unknown</strong> — a
 *                           funding bill whose amount varies has no monthly figure, and zero
 *                           would be a claim that nothing is going in
 * @param fundingVaries      how many funding bills have no fixed amount. Above zero, the pace
 *                           cannot be judged, and this is why
 * @param timeElapsedPercent 0-100, the share of the time from adding the goal to its target
 *                           date that has gone. Kept for display; <strong>it no longer
 *                           decides the pace</strong> — see {@link GoalPace}
 * @param schedule           the goal's dated amounts, earliest first - see {@link GoalScheduleLine}
 */
public record GoalView(Goal goal, BigDecimal currentAmount, BigDecimal spentAmount, BigDecimal progressPercent,
                       BigDecimal requiredPerMonth, BigDecimal fundedPerMonth, int fundingVaries,
                       GoalPace pace, BigDecimal timeElapsedPercent,
                       List<GoalScheduleLine> schedule) {
}
