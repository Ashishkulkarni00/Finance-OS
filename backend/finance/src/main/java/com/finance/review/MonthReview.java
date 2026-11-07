package com.finance.review;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One salary month, consolidated - the row behind every chart on Summary.
 *
 * <p>Derived live, never read from {@code CycleSnapshot}: the user asked for a
 * consolidation they can see <em>now</em>, and no cycle has ever been closed, so a
 * snapshot-backed series would be permanently empty. A closed cycle's snapshot stays the
 * historical record (ADR-0011); this is the same arithmetic run against the ledger as it
 * stands, which is exactly what {@code CycleService.previewSummary} already does for one
 * month.
 *
 * <p><strong>When {@link #recorded} is false every money field is null, never zero.</strong>
 * A salary month with no transactions in it is a month we know nothing about - printing
 * ₹0 income for it would put a flat line through four charts and read as a fact (rule 3,
 * ADR-0006). The commitment counts are kept regardless, because a bill falling due is a
 * plan fact that does not depend on anything having been recorded.
 *
 * @param current          the month containing today. Its figures are partial by definition -
 *                         {@link #elapsedShare} says how partial
 * @param recorded         whether any transaction at all falls inside the month
 * @param planTracked      whether the month had any commitment fall due in it at all.
 *                         <strong>False means the committed/flexible split is withheld</strong>,
 *                         not that it was zero. A month from before the plan was set up has
 *                         nothing linked to a bill, so the arithmetic says "0% committed" -
 *                         which is true of the links and false about the person, and it
 *                         would draw a committed share collapsing to nothing exactly
 *                         backwards. Found on the real August cycle (2026-10-24)
 * @param elapsedShare     how much of the month has passed, 0-1. Null unless {@link #current}
 * @param spend            expenses net of refunds - the same figure the month's own summary shows
 * @param committed        the part of {@link #spend} that settled a planned commitment.
 *                         Resolved by the <em>link</em>, not by category group: the
 *                         committed/flexible split that drives Real Balance lives on
 *                         {@code Commitment}, and a fixed-category expense no bill covers
 *                         really is day-to-day money ({@code CategoryGroup}'s own note)
 * @param flexible         the rest - day-to-day spending. {@code committed + flexible = spend}
 * @param net              {@code income − spend}. Investing is not consuming, so it is not
 *                         subtracted here
 * @param leftOver         {@code income − spend − invested} - what stayed liquid
 * @param savingsRate      {@code net ÷ income}. Null when no income is recorded: a rate over
 *                         no income is not a fact
 * @param committedShare   {@code committed ÷ income} - the number that has to come down, and
 *                         the one figure on this screen that is a measure of progress rather
 *                         than of activity. Null without income
 * @param commitmentsKept  paid, or settled in an earlier cycle - the North Star, per cycle.
 *                         Counts <strong>bills only</strong>: occurrences of an income
 *                         commitment are filtered out before counting, because a salary
 *                         credit is not a promise the user keeps. The filter lives in
 *                         {@code PlanAdherence}, so this figure and the one written into
 *                         the snapshot at close are the same arithmetic (FIX_BACKLOG 1.15,
 *                         fixed 2026-11-07)
 * @param plannedCommittedTotal what the plan said would leave spending money this month -
 *                         bills <em>and</em> money set aside, so it is deliberately larger
 *                         than {@link #committed}, which counts only what was spent
 */
public record MonthReview(
        Long cycleId,
        LocalDate startDate,
        LocalDate endDate,
        String label,
        boolean current,
        boolean closed,
        boolean recorded,
        boolean planTracked,
        BigDecimal elapsedShare,
        BigDecimal income,
        BigDecimal spend,
        BigDecimal committed,
        BigDecimal flexible,
        BigDecimal invested,
        BigDecimal net,
        BigDecimal leftOver,
        BigDecimal savingsRate,
        BigDecimal committedShare,
        Integer commitmentsPlanned,
        Integer commitmentsKept,
        BigDecimal plannedCommittedTotal,
        BigDecimal actualCommittedTotal
) {
}
