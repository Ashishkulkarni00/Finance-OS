package com.finance.review;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * What one salary month's spending actually went on, ranked.
 *
 * <p>The detail the charts above it deliberately do not carry. Three bands say money went
 * out; this says where. On the real October cycle the single most useful fact on the whole
 * screen lives here and nowhere else: <strong>₹11,257 of ₹28,447 of day-to-day money went
 * on one category.</strong>
 *
 * <p><strong>It reconciles.</strong> Every category's {@code total} sums to the month's
 * {@code spend}, and each one's committed and day-to-day parts sum to its own total, because
 * the split is taken from the same commitment link the rest of Summary uses. A breakdown
 * that did not add up to the figure beside it would be worse than no breakdown.
 *
 * <p>Deliberately <strong>not</strong> {@code CycleService.flexibleSpending}, which answers a
 * neighbouring question - what went on FLEXIBLE-group categories - and gives a different
 * total (₹14,864 against ₹28,447 on the same month). Both are correct; showing them side by
 * side without saying so would not be. See the note on
 * {@code TransactionRepository.sumUnplannedByCategoryInRange}.
 *
 * <p>Sub-categories roll up into their parent, as they do on Months: four fragments of
 * Transport is four rows that cannot answer "is transport up on last month".
 *
 * @param spend      the month's total, net of refunds - what the rows add to
 * @param categories ranked by total, largest first
 */
public record MonthCategories(
        Long cycleId,
        String label,
        LocalDate startDate,
        LocalDate endDate,
        boolean recorded,
        boolean planTracked,
        BigDecimal spend,
        BigDecimal committed,
        BigDecimal flexible,
        List<Line> categories
) {

    /**
     * @param committed       the part of this category that settled a planned commitment.
     *                        <strong>Null when the month has no plan behind it</strong> -
     *                        withheld rather than zeroed, exactly as on {@code MonthReview}
     * @param share           of the month's whole spend. Null when nothing was spent
     * @param shareOfFlexible of its day-to-day money. Null when there was none, and the
     *                        more telling of the two: a category at 76% of what is actually
     *                        discretionary is a different statement from 17% of everything
     */
    public record Line(
            Long categoryId,
            String name,
            String group,
            BigDecimal total,
            BigDecimal committed,
            BigDecimal flexible,
            BigDecimal share,
            BigDecimal shareOfFlexible
    ) {
    }
}
