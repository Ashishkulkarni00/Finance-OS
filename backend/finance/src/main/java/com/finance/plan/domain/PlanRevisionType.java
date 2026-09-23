package com.finance.plan.domain;

/**
 * What kind of change was made to the plan.
 *
 * <p>The distinction that earns its place is {@link #AMENDED} versus {@link #SUPERSEDED}:
 * an amendment changes the plan line everywhere, including months already past, while a
 * supersession ends the old rule and starts a new one from a date - so history keeps the
 * figures that were true at the time. That is what {@code applyFrom} does today; until
 * now nothing recorded which of the two had happened.
 */
public enum PlanRevisionType {

    /** The plan line was added. */
    CREATED,

    /** Changed in place - the new figures apply to the whole life of the line. */
    AMENDED,

    /**
     * Changed from a date. The old rule was ended the day before and a new one starts
     * here; {@code supersededSubjectId} points back at the rule that ended.
     */
    SUPERSEDED,

    /** Archived - it stops generating occurrences, but it is not gone. */
    PAUSED,

    /** Unarchived. */
    RESUMED,

    /** Deleted. The line stops; its revisions stay. */
    ENDED,

    /**
     * Changed because its source changed - a loan's EMI was corrected, a holding's
     * instalment moved. A real change to the plan, but not one decided here, so a
     * "what did I decide this month?" view can filter it out while "what changed this
     * month?" keeps it. See ADR-0015.
     */
    SYNCED;

    /** Whether the user made this call themselves, as opposed to it following a source. */
    public boolean isUserDecision() {
        return this != SYNCED;
    }
}
