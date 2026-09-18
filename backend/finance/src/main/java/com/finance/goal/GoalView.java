package com.finance.goal;

import com.finance.goal.domain.Goal;

import java.math.BigDecimal;

/**
 * @param timeElapsedPercent 0-100, the share of the time from adding the goal to its target
 *                           date that has gone. Null when it can't be worked out.
 */
public record GoalView(Goal goal, BigDecimal currentAmount, BigDecimal progressPercent, BigDecimal requiredPerMonth,
                       GoalPace pace, BigDecimal timeElapsedPercent) {
}
