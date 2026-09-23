package com.finance.plan.domain;

/**
 * What kind of plan line a revision is about.
 *
 * <p>Deliberately narrow. A plan is the set of things the user has promised future money
 * to: the bills they pay every cycle and the goals they are saving toward. A loan or a
 * holding is not a plan line in itself - it is a fact about the world that a commitment
 * then follows, and changing it shows up here as a {@code SYNCED} revision on that bill.
 */
public enum PlanSubjectType {

    /** A commitment rule - see {@code com.finance.commitment.domain.Commitment}. */
    COMMITMENT,

    /** A savings goal - see {@code com.finance.goal.domain.Goal}. */
    GOAL
}
