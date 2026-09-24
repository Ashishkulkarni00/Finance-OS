package com.finance.commitment;

import com.finance.common.money.MoneyScale;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.transaction.domain.TransactionType;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;

/**
 * What a commitment adds to the monthly cash requirement - the figure that turns a plan
 * change from a diff into a decision with a price (ADR-0015).
 *
 * <p>Two rules worth stating, because both are easy to get silently wrong:
 *
 * <ul>
 *   <li><strong>Null is unknown, not zero.</strong> A {@code VARIABLE} commitment has no
 *       monthly figure. Treating it as zero would report "+₹0/month" for a change that
 *       might cost anything - precisely the confident wrong answer ADR-0006 forbids.</li>
 *   <li><strong>Income is negated.</strong> A commitment settled as {@code INCOME} is money
 *       arriving, so expecting more of it <em>lowers</em> what has to be found each month.
 *       Positive always means "more money needed".</li>
 * </ul>
 *
 * <p>A quarterly or annual bill is spread across the months it covers. That is the right
 * comparison for "what did this decision cost me per month", even though the cash lands in
 * one cycle - the cycle-level view of that is what commitment instances already show.
 */
public final class CommitmentMonthlyCost {

    private CommitmentMonthlyCost() {
    }

    /** Null when the amount is not known. */
    public static BigDecimal of(Commitment commitment) {
        if (commitment == null || commitment.getFixedAmount() == null) {
            return null;
        }
        BigDecimal perMonth = switch (commitment.getFrequency()) {
            case MONTHLY -> commitment.getFixedAmount();
            case QUARTERLY -> divide(commitment.getFixedAmount(), 3);
            case ANNUAL -> divide(commitment.getFixedAmount(), 12);
        };
        return commitment.getSettleAs() == TransactionType.INCOME
                ? MoneyScale.normalise(perMonth.negate())
                : MoneyScale.normalise(perMonth);
    }

    /** The cost of a commitment that is about to stop, or has not started: zero, not unknown. */
    public static BigDecimal none() {
        return MoneyScale.ZERO;
    }

    /**
     * A "just once" bill ({@code PLANNED_CHANGES.md}): a MONTHLY rule whose whole window is a
     * single salary cycle.
     *
     * <p>It has an amount and a frequency like any other bill, and it is <strong>not a
     * rate</strong>. A ₹30,000 one-off top-up is not ₹30,000 a month, and anything asking
     * "how much per month?" has to exclude it or be wrong by the whole amount.
     *
     * <p>Lives here so the forecast (whose unlocks must not treat a one-off's end as capacity
     * freeing up) and the goal engine (whose funding rate must not include it) share one
     * definition. Same ~31-day threshold as {@code isOneOff} in {@code commitmentForm.ts}, so
     * the frontend cannot disagree with either about what counts.
     */
    public static boolean isOneOff(Commitment commitment) {
        if (commitment == null || commitment.getFrequency() != CommitmentFrequency.MONTHLY
                || commitment.getActiveTo() == null) {
            return false;
        }
        long days = ChronoUnit.DAYS.between(commitment.getActiveFrom(), commitment.getActiveTo());
        return days >= 0 && days <= 31;
    }

    private static BigDecimal divide(BigDecimal amount, int months) {
        // Full precision through the division; rounded once at the boundary by normalise.
        return amount.divide(BigDecimal.valueOf(months), MoneyScale.SCALE + 4, MoneyScale.ROUNDING);
    }
}
