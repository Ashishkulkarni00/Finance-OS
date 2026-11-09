package com.finance.recovery;

import java.math.BigDecimal;
import java.util.List;

/**
 * A concrete way back from a month that has gone wrong - ROADMAP 6.2.
 *
 * <p>Every other money app, on a bad month, shows red. This says what to do: which optional
 * payments could wait, what could be released from money set aside, what would still be
 * left to absorb by spending less - and how and when it gets put back. It is a set of
 * levers in a sensible order, never an instruction: the user picks (D8), and nothing moves
 * on its own.
 *
 * @param state          ON_COURSE (no plan needed), STRETCHED (covered, but not the usual
 *                       day-to-day spending), BROKEN (bills exceed what is held), INCOMPLETE
 * @param gap            what needs finding before salary; null when ON_COURSE or unknown
 * @param daysToSalary   days left in this salary month, today included
 * @param steps          levers in order: defer optional payments, release set-aside money,
 *                       then whatever is left as less day-to-day spending
 * @param stillShort     what no lever covers - absorbed by spending less; zero when covered
 * @param catchUp        what would need putting back afterwards (deferred + released)
 * @param catchUpMonths  how many salary months it takes to put it back without going below
 *                       usual day-to-day spending; null when no month has room or no history
 * @param catchUpPerMonth what each of those months puts back
 * @param reason         one plain sentence saying where things stand
 */
public record RecoveryPlan(
        State state,
        BigDecimal gap,
        int daysToSalary,
        List<Step> steps,
        BigDecimal stillShort,
        BigDecimal catchUp,
        Integer catchUpMonths,
        BigDecimal catchUpPerMonth,
        String reason
) {
    public enum State { ON_COURSE, STRETCHED, BROKEN, INCOMPLETE }

    /**
     * One lever.
     *
     * @param kind     DEFER (an optional payment waits), RELEASE (money set aside comes back
     *                 into play), SPEND_LESS (the rest, as a lower day rate)
     * @param refId    the commitment instance for DEFER; null otherwise
     * @param amount   what this step covers
     * @param perDayLess SPEND_LESS only: how much lower the day rate would be than usual
     */
    public record Step(Kind kind, Long refId, String label, BigDecimal amount, BigDecimal perDayLess) {
        public enum Kind { DEFER, RELEASE, SPEND_LESS }
    }
}
