package com.finance.review;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Every loan's balance walked forward to the day the last one clears.
 *
 * <p>The one chart on Summary that is full of data on day one. The month-by-month series
 * needs months to accumulate; this needs only the loans, because it is derived from each
 * one's own amortisation ({@code AmortisationCalculator.schedule}) rather than from
 * history. It is the product's actual promise - carrying a commitment through time - drawn
 * as a line.
 *
 * <p><strong>It assumes the EMIs get paid.</strong> {@link #unrecordedEmis} is how many
 * have already fallen due with nothing recorded against them; the curve walks past them
 * anyway, because the alternative is to assume a missed payment, and neither assumption is
 * a fact (ADR-0018). The figure is published so the screen can say so rather than imply it.
 *
 * @param outstandingNow     owed today across every loan in the curve
 * @param debtFreeDate       the last loan's payoff date, or <strong>null when any loan is
 *                           excluded</strong> - a debt-free date that quietly omits a loan
 *                           is the most encouraging possible lie ({@code DebtPosition})
 * @param interestAhead      what the remaining EMIs still cost in interest from here. The
 *                           number that makes an early payment mean something
 * @param points             one per calendar month, from this one to the last payoff
 * @param excludedLoanCount  loans with no rate recorded, so no schedule can be generated
 *                           for them. Their balance is not in the curve and the screen says
 *                           so, rather than the curve quietly understating what is owed
 */
public record DebtTrajectory(
        LocalDate asOf,
        BigDecimal outstandingNow,
        LocalDate debtFreeDate,
        Integer monthsToDebtFree,
        BigDecimal interestAhead,
        int unrecordedEmis,
        List<Point> points,
        /**
         * One balance series per loan in the curve, aligned index-for-index with
         * {@link #points}, ordered <strong>soonest payoff first</strong>.
         *
         * <p>A single total line says the debt falls. It does not say which loan is most of
         * it, or which one ends next - and "which one ends next" is the only part a person
         * can act on. Stacked in this order, the bands peel away from the top as each loan
         * clears, so the shape of the next eighteen months is readable rather than inferred.
         */
        List<Series> series,
        List<Loan> loans,
        int excludedLoanCount,
        BigDecimal excludedOutstanding
) {

    /**
     * @param month        the first of the calendar month, as its label
     * @param outstanding  owed at the end of it, across every loan in the curve
     * @param principalDue what the EMIs falling in this month take off the principal, and
     *                     {@code interestDue} what they cost in interest - <strong>both null
     *                     on the first point</strong>, which is the month in progress. This
     *                     walk is strictly forward from today, so EMIs already due earlier
     *                     this month are not in it, and a zero there would read as "nothing
     *                     was due" when the truth is "this endpoint does not look back".
     *
     *                     <p>From the second point on, the drop in {@code outstanding} is
     *                     exactly that month's {@code principalDue}. Across the first
     *                     interval it is larger, by any EMI that has already fallen due with
     *                     nothing recorded against it - which is what {@code unrecordedEmis}
     *                     counts and the screen says out loud.
     */
    public record Point(LocalDate month, BigDecimal outstanding,
                        BigDecimal principalDue, BigDecimal interestDue) {
    }

    /** @param balances owed at the end of each month in {@code points}; zero once it clears */
    public record Series(Long loanId, String name, List<BigDecimal> balances) {
    }

    /** @param inCurve false when the loan has no rate, so it contributes nothing to the line */
    public record Loan(Long loanId, String name, BigDecimal outstanding, BigDecimal emi,
                       LocalDate payoffDate, boolean inCurve) {
    }
}
