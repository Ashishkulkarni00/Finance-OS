package com.finance.effect;

import com.finance.insight.Insight;
import com.finance.insight.domain.InsightState;

import java.math.BigDecimal;
import java.util.List;

/**
 * What a write just did, reported by the write itself (ADR-0017, ROADMAP 0.4).
 *
 * <p>Service-layer result, not a DTO - {@code WriteEffectMapper} shapes it for the wire.
 *
 * <p>Both sides of each figure are carried on purpose. "₹999 left today" is information;
 * "₹1,199 → ₹999" is a consequence, and the consequence is the entire point of the reactive
 * layer ({@code FINANCIAL_OS.md} §3.3).
 *
 * <p>The day figure is {@code roomLeft}, <strong>not</strong> {@code roomToday}.
 * {@code PositionServiceImpl} computes the day's allowance as
 * {@code (realBalance + spentToday) / days} - deliberately adding today's spending back, so
 * the allowance is stable across the day. That makes it <em>invariant to the very write we
 * are reporting on</em>: an effect built on it always showed "no change". {@code roomLeft}
 * is the allowance minus what has gone today, and is the number that moves.
 *
 * <p>Any figure may be null, and null means <strong>unknown</strong> - never zero (ADR-0006).
 * Position refuses to compute when a mandatory commitment has no amount yet, and a
 * confident "₹0 a day" in that situation would be the worst thing this product could say.
 *
 * @param started warnings that just became true, capped for display
 * @param cleared warnings that just stopped being true - the recovery, which is worth as
 *                much as the warning and has never been sayable before
 * @param moreStarted how many started beyond those listed
 * @param moreCleared how many cleared beyond those listed
 */
public record WriteEffect(
        BigDecimal leftTodayBefore,
        BigDecimal leftTodayAfter,
        BigDecimal realBalanceBefore,
        BigDecimal realBalanceAfter,
        List<Insight> started,
        List<InsightState> cleared,
        int moreStarted,
        int moreCleared,
        Prominence prominence
) {

    /**
     * How loudly to say it. The user's own framing: quiet by default, and
     * <em>"whenever it requires my attention it should be louder and clearer"</em>.
     */
    public enum Prominence {
        /** Something needs acknowledging before moving on - CRITICAL or ATTENTION. */
        HELD,
        /** The change, stated once and not insisted on. */
        QUIET
    }
}
