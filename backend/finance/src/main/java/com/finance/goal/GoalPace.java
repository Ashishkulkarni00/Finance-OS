package com.finance.goal;

/**
 * Whether a goal is keeping up with its own deadline. Derived on every read, never stored
 * (ADR-0011).
 *
 * <p>Measured against time: a goal is {@link #BEHIND} when the share of the target saved
 * trails the share of the time gone (from when the goal was added to its target date) by
 * more than {@link GoalServiceImpl#PACE_TOLERANCE_POINTS} points. The better test, "is
 * the monthly contribution enough?", needs a bill linked to its goal, which doesn't exist
 * yet.
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
