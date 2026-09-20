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
 * @param timeElapsedPercent 0-100, the share of the time from adding the goal to its target
 *                           date that has gone. Null when it can't be worked out.
 * @param schedule           the goal's dated amounts, earliest first - see {@link GoalScheduleLine}
 */
public record GoalView(Goal goal, BigDecimal currentAmount, BigDecimal spentAmount, BigDecimal progressPercent,
                       BigDecimal requiredPerMonth, GoalPace pace, BigDecimal timeElapsedPercent,
                       List<GoalScheduleLine> schedule) {
}
