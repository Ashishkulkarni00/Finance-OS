package com.finance.decision;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One thing freed-up money could do, with what it would cost or save.
 *
 * <p>The point of ROADMAP 4.4: when an EMI ends, the product already knows ₹2,648 a month
 * has stopped leaving. Telling someone that is a notification. Telling them that putting it
 * on the education loan clears it eleven months sooner and saves ₹14,200 in interest — next
 * to what it would do for the emergency fund, next to simply keeping it — is a decision.
 *
 * <p><strong>Every option is costed in its own unit.</strong> A loan option is months and
 * interest; a goal option is a date; keeping it is a day rate. Forcing them onto one scale
 * would mean inventing an exchange rate between peace of mind and 22% interest, which is the
 * user's call and not a calculation.
 *
 * @param clearsMonthsSooner for a loan: how many fewer EMIs. Null for other kinds
 * @param interestSaved      for a loan: what those EMIs would have cost in interest
 * @param reachesOn          for a goal: when the target would be met instead
 * @param reachesMonthsSooner for a goal: how much earlier that is. Null when the goal has
 *                           no honest current pace to compare against
 * @param unknownReason      why an option could not be costed. Set instead of guessing - a
 *                           loan without a rate cannot be projected, and saying so is better
 *                           than quietly leaving it out of the comparison (ADR-0006)
 */
public record UnlockOption(
        Kind kind,
        Long targetId,
        String targetName,
        BigDecimal amount,

        Integer clearsMonthsSooner,
        BigDecimal interestSaved,

        LocalDate reachesOn,
        Integer reachesMonthsSooner,

        String unknownReason
) {
    public enum Kind {
        /** Add it to a loan's EMI. Ranked by interest saved - the only option with a hard number. */
        LOAN,
        /** Add it to what funds a goal each month. */
        GOAL,
        /** Keep it as day-to-day money. Always offered, always last, never framed as the lazy choice. */
        KEEP
    }
}
