package com.finance.state;

import java.math.BigDecimal;

/**
 * How long the user could meet their obligations if income stopped
 * ({@code FINANCIAL_STATE.md} §2, ROADMAP 2.1).
 *
 * <p>The most legible safety figure there is, and the one number an emergency fund exists to
 * move. Deliberately different from Real Balance in two ways, both of which matter:
 *
 * <ul>
 *   <li><strong>It counts money Real Balance will not.</strong> Real Balance answers "what
 *       can I spend today", so it excludes the emergency fund by design. Runway asks the
 *       opposite question — "what could I reach if I had to" — and the emergency fund is
 *       precisely the answer. Excluding it here would make the fund invisible to the one
 *       measure it is for.</li>
 *   <li><strong>It counts obligations, not living costs.</strong> {@link #monthlyEssentials}
 *       is the user's <em>mandatory commitments</em>: EMIs, rent, family support, insurance.
 *       Day-to-day spending is on top of this, and {@link #coversEssentialsOnly} is true so
 *       no screen can imply otherwise.</li>
 * </ul>
 *
 * <p><strong>Savings are not an obligation.</strong> A SIP or an emergency-fund transfer is
 * excluded from {@code monthlyEssentials}: in the situation runway describes, those stop.
 * Counting them would understate the runway by pretending the user would keep investing
 * while out of work.
 *
 * <p><strong>An unpriced bill makes this a ceiling, not a blank.</strong> Something is almost
 * always unpriced — a variable electricity bill is enough — so refusing outright would leave
 * the figure null forever, and a safety measure nobody ever sees is not a safety measure. When
 * some mandatory bills have no amount, the runway is computed from the ones that do and marked
 * {@link #upperBound}: essentials can only grow, so the runway can only shrink. "At most 1.5
 * months" is wrong only in the conservative direction, which is the one direction a safety
 * figure may be wrong in. Ahead already says "up to ₹X" for the same reason.
 *
 * @param months             liquid ÷ essentials, to one decimal. Null only when nothing at all
 *                           can be said - never zero, which reads as "no runway" (ADR-0006)
 * @param upperBound         true when unpriced bills were left out, so the real figure is this
 *                           or less. The UI must say "at most"
 * @param liquidTotal        what could actually be reached; null when it cannot be determined
 * @param monthlyEssentials  mandatory obligations per month, annual and quarterly ones spread
 * @param unknownBillCount   how many mandatory bills still have no amount
 * @param unknownReason      plain words when {@code months} is null; null when it is known
 * @param coversEssentialsOnly always true today - carried so the UI cannot quietly forget it
 * @param basis              every balance counted and every bill weighed, including the ones
 *                           left out - the answer to "why is this 1.7?" (ROADMAP 2.3)
 */
public record Runway(
        BigDecimal months,
        boolean upperBound,
        BigDecimal liquidTotal,
        BigDecimal monthlyEssentials,
        int unknownBillCount,
        String unknownReason,
        boolean coversEssentialsOnly,
        Provenance basis
) {

    public boolean isKnown() {
        return months != null;
    }

    static Runway unknown(BigDecimal liquidTotal, BigDecimal monthlyEssentials, int unknownBills,
                          String reason, Provenance basis) {
        return new Runway(null, false, liquidTotal, monthlyEssentials, unknownBills, reason, true, basis);
    }
}
