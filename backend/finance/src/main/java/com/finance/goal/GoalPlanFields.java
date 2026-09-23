package com.finance.goal;

import com.finance.goal.domain.Goal;
import com.finance.plan.PlanChangeDraft;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A goal's plan-relevant fields, captured before a change so they can be compared after
 * it. See ADR-0015.
 *
 * <p>{@code requiredPerMonth} is the figure that matters. Moving an emergency fund's
 * target date out by a year is not a metadata edit - it is a decision that changes what
 * has to be found every month, and until now it left no trace at all. That is exactly the
 * user's real situation: a ₹2L goal needing ₹15,182/month that does not exist, reading
 * "on track".
 *
 * <p>Where the goal is tracked is captured by <strong>name</strong>, frozen at the time of
 * the change, for the reason set out on {@code CommitmentPlanFields}.
 */
record GoalPlanFields(
        String name,
        BigDecimal targetAmount,
        LocalDate targetDate,
        Integer priority,
        String trackedIn,
        BigDecimal requiredPerMonth
) {

    /**
     * @param trackedIn the reservation or account this goal's money sits in, by name;
     *                  null when it tracks neither
     */
    static GoalPlanFields of(GoalView view, String trackedIn) {
        Goal goal = view.goal();
        return new GoalPlanFields(
                goal.getName(),
                goal.getTargetAmount(),
                goal.getTargetDate(),
                goal.getPriority(),
                trackedIn,
                view.requiredPerMonth());
    }

    void diffInto(PlanChangeDraft draft, GoalPlanFields after) {
        draft.text("name", "Name", name, after.name())
                .money("targetAmount", "Target", targetAmount, after.targetAmount())
                .date("targetDate", "Target date", targetDate, after.targetDate())
                .number("priority", "Priority", priority, after.priority())
                .text("trackedIn", "Tracked in", trackedIn, after.trackedIn());
    }
}
