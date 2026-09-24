package com.finance.goal;

/**
 * Whether a goal is keeping up with its own deadline. Derived on every read, never stored
 * (ADR-0011).
 *
 * <p><strong>Measured against funding, not against the calendar.</strong> A goal is
 * {@link #ON_TRACK} when what the plan puts into it each month is at least what reaching the
 * target by its date requires. Nothing else counts as on track.
 *
 * <p>It used to compare the share of the target saved against the share of the time gone,
 * and that was wrong in the way that matters most: it called a goal on track because money
 * happened to be in the account on the day the goal was created. The user's emergency fund
 * read {@code ON_TRACK} at 16.5% saved with 2.56% of the time gone, while needing ₹15,182 a
 * month that does not exist anywhere in the plan. A goal nobody is funding cannot be on
 * track, however recently it was created - and under the old rule a goal added yesterday
 * always was, because no time had passed yet.
 *
 * <p>This is the test the previous note here called "the better test… needs a bill linked to
 * its goal, which doesn't exist yet". Goal-funded bills do exist now
 * ({@code CommitmentSource.GOAL}), so the better test is the one in use.
 *
 * <p>{@link #UNKNOWN} is a real answer and is returned freely: when a funding bill's amount
 * varies, what goes in each month is genuinely the user's decision, and no honest claim can
 * be made about whether it is enough (ADR-0006).
 */
public enum GoalPace {
    /** The target amount is already there. */
    REACHED,
    /** The target date has passed without the target being reached. */
    OVERDUE,
    BEHIND,
    ON_TRACK,
    /** Not enough to judge - e.g. a goal whose target date is the day it was added. */
    UNKNOWN
}
