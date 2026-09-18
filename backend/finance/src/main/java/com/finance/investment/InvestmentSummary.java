package com.finance.investment;

import java.math.BigDecimal;
import java.util.List;

/**
 * The Investments page's standing block.
 *
 * <p>The workbook's own total row reads <em>"Total invested ₹2,52,500 · Partly updated"</em>
 * - a figure and, next to it, an admission about the figure. {@link ValuationState} is
 * that admission, modelled rather than written as a note, so the page can never show a
 * gain total that quietly omits the holdings nobody has valued.
 *
 * @param totalInvested      what has gone in across every holding - always knowable
 * @param valuedTotalInvested what has gone into the holdings that <em>have</em> been
 *                           valued. The only figure {@code totalCurrentValue} may
 *                           honestly be compared against
 * @param totalCurrentValue  the sum of the hand-kept values. Covers only valued holdings
 * @param totalGain          {@code totalCurrentValue - valuedTotalInvested}. Null when
 *                           nothing has been valued at all
 * @param totalGainPercent   that gain as a fraction of what went into the valued
 *                           holdings (0.08 is 8%), never pre-multiplied - same convention
 *                           as {@code savingsRate}. Computed here because a ratio of two
 *                           money figures is money arithmetic, which the browser does not
 *                           do (FRONTEND_CONVENTIONS §4)
 * @param outsideLedgerTotal invested in holdings with no ledger account, and therefore
 *                           absent from net worth. Surfaced rather than silently missing
 * @param illiquidTotal      invested in holdings that couldn't be reached if needed
 * @param liquidTotal        invested in holdings that could be. Its own figure because the
 *                           page's "within reach" group used to be captioned with
 *                           {@code totalInvested} - every holding, including the locked
 *                           ones listed under it - and the browser can't subtract
 * @param monthlyContributionTotal every holding's monthly contribution, added up. Zero
 *                           when none is set
 * @param allocation         each holding's share of what's invested, largest first - what
 *                           the "where it's put" bar is drawn from
 */
public record InvestmentSummary(
        int count,
        BigDecimal totalInvested,
        BigDecimal valuedTotalInvested,
        BigDecimal totalCurrentValue,
        BigDecimal totalGain,
        BigDecimal totalGainPercent,
        BigDecimal outsideLedgerTotal,
        BigDecimal illiquidTotal,
        int valuedCount,
        ValuationState valuationState,
        BigDecimal liquidTotal,
        BigDecimal monthlyContributionTotal,
        List<Allocation> allocation
) {

    /** How much of the register has a current value behind it. */
    public enum ValuationState {
        /** Every holding has been valued - the gain figures are complete. */
        ALL_UPDATED,
        /** Some have, some haven't. Any gain total describes only part of the register. */
        PARTLY_UPDATED,
        /** Nothing has been valued. There is no gain to show, and saying "₹0 gain" would
         *  be a claim about the investments rather than about our records. */
        NONE_UPDATED
    }

    /**
     * One holding's slice of what's invested.
     *
     * @param share fraction of {@code totalInvested} (0.94 is 94%), never pre-multiplied.
     *              Null when nothing is invested at all - a share of nothing is undefined
     */
    public record Allocation(Long investmentId, String name, BigDecimal totalInvested, BigDecimal share, boolean liquid) {
    }
}
