package com.finance.decision;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * What spending a given amount today would cost — the first piece of the decision engine
 * (ROADMAP 4.2).
 *
 * <p><strong>Not a yes or a no.</strong> Every other money app can tell you whether a number
 * is smaller than another number. The thing this product exists to say is what the decision
 * <em>costs</em>: the day rate you would be living on afterwards, and the dated payment, if
 * any, that stops being covered. A verdict without those is a guess the reader has to take on
 * trust, and "no" is a judgement nobody asked for (CLAUDE.md rule 8).
 *
 * <p><strong>The state describes the money, never the person.</strong> {@code TIGHTENS} is a
 * fact about a rate; "you can't afford this" would be a fact about someone's life, which this
 * does not know.
 *
 * @param perDayAfter   what is left per remaining day once this has gone. Null when the
 *                      position is incomplete, or when there is nothing left to spread
 * @param shortfallName the first dated payment that stops being covered, null when none
 * @param shortBy       how far short that payment would be left, null when none
 */
public record AffordabilityResult(
        State state,
        BigDecimal amount,
        Long accountId,
        String accountName,

        /** Free until salary as it stands, and as it would stand. */
        BigDecimal freeBefore,
        BigDecimal freeAfter,

        /** The day rate as it stands, and as it would stand. The cost, in one comparison. */
        BigDecimal perDayBefore,
        BigDecimal perDayAfter,
        int daysToSalary,

        /** What the chosen account holds, and what it would hold. */
        BigDecimal accountBalanceBefore,
        BigDecimal accountBalanceAfter,

        String shortfallName,
        LocalDate shortfallOn,
        BigDecimal shortBy,

        /** Why no answer is possible. Set only when {@code state} is INCOMPLETE. */
        String reason
) {
    public enum State {
        /** It fits, and nothing about the month changes shape. */
        FITS,
        /** It fits, but the rate left to live on drops materially. */
        TIGHTENS,
        /** A specific dated payment stops being covered. Named, with the date and the gap. */
        SHORTFALL,
        /** More than the chosen account holds today, whatever the month looks like. */
        EXCEEDS_ACCOUNT,
        /**
         * A mandatory bill has no amount, so Free until salary is unknown — and an answer
         * built on an unknown would be a confident guess (ADR-0006).
         */
        INCOMPLETE
    }
}
