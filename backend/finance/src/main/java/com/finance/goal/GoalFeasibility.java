package com.finance.goal;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Whether a goal can actually be met from the money that will be free before its date -
 * ROADMAP 5.1, the half that reads cash flow.
 *
 * <p>{@link GoalPace} answers "is the plan funding this goal?". This answers the harder
 * question behind it: "if the plan isn't, is there any money that could?" A goal whose gap is
 * larger than every rupee the months before its date will leave free is not behind; it is
 * fiction, and saying so early is kinder than letting the date arrive.
 *
 * <p>Goals compete for the same free money (5.2's contention, derived rather than stored):
 * they are judged in priority order, then by date, and each one's gap is taken out of the
 * free money before the next is judged. Two goals that each fit alone can fail together.
 *
 * @param stillNeeded      target less what is already saved or spent
 * @param planWillAdd      what the goal's own funding bills add before the date; null when
 *                         a funding bill has no fixed amount (unknown, never zero)
 * @param gap              what has to come out of free money; zero when the plan covers it
 * @param freeByDeadline   free money before the date after usual day-to-day spending and
 *                         after higher-priority goals; null when there is no spending history
 * @param freeCeiling      the same before day-to-day spending - the most that could possibly
 *                         be free. A gap above this is certain, not a forecast
 * @param shortBy          on DOES_NOT_FIT, how far the gap exceeds the ceiling
 * @param perMonthFromFree the gap spread over the months counted - "₹X a month beyond the plan"
 * @param monthsCounted    salary months between now and the date, this one included
 * @param reason           one plain sentence saying why, for every state
 */
public record GoalFeasibility(
        Long goalId,
        String name,
        LocalDate targetDate,
        State state,
        BigDecimal stillNeeded,
        BigDecimal planWillAdd,
        BigDecimal gap,
        BigDecimal freeByDeadline,
        BigDecimal freeCeiling,
        BigDecimal shortBy,
        BigDecimal perMonthFromFree,
        int monthsCounted,
        String reason
) {
    public enum State {
        /** The goal's own funding bills reach the target by the date. */
        COVERED_BY_PLAN,
        /** The gap fits in free money after usual spending and higher-priority goals. */
        FITS,
        /** Fits only if something uncertain goes the right way - spending below usual, or a bill with no amount staying small. */
        FITS_IF,
        /** Larger than the most that could possibly be free before the date. */
        DOES_NOT_FIT,
        /** No date, no target, or too far ahead to project. Never guessed. */
        UNKNOWN
    }
}
