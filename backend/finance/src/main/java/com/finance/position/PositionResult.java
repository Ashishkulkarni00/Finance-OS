package com.finance.position;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service-layer result for Real Balance/Room - not a DTO. {@code PositionMapper}
 * shapes this into {@code PositionResponse} for the wire. Kept separate so the
 * service layer never has to know about JSON serialisation annotations.
 */
public record PositionResult(
        boolean complete,
        BigDecimal realBalance,
        /**
         * Today's share, fixed for the day: today's spending is added back before dividing,
         * so buying a coffee does not visibly shrink the allowance you are measuring
         * yourself against. It is a <em>benchmark for today</em>, and deliberately not a
         * rate you could sustain - see {@code perDay}.
         */
        BigDecimal roomToday,
        BigDecimal roomLeft,
        /**
         * What is actually left, per remaining day - {@code realBalance / daysRemaining}.
         *
         * <p>The honest answer to "what can I spend a day from here", and the figure a
         * screen may safely put next to "for N days", because it multiplies back to exactly
         * what is held. {@code roomToday} does not: it adds today's spending back, so
         * "₹187 a day for 29 days" promised ₹5,411 against ₹5,149 held - overstated by
         * precisely the day's spending, which is a confident wrong number on the main screen
         * (rule 3). Found by the user 2026-09-29.
         *
         * <p>Both are kept because they answer different questions. One is "how am I doing
         * today", which must not move while the day is in progress; the other is "what can I
         * afford from here", which must move the moment money leaves.
         */
        BigDecimal perDay,
        BigDecimal spentToday,
        BigDecimal held,
        BigDecimal reserved,
        BigDecimal committed,
        /** The part of {@code committed} that is optional bills - skippable. */
        BigDecimal optionalCommitted,
        /** Owed on credit cards: already spent, still to be paid from held money. */
        BigDecimal cardDues,
        List<AccountAmount> accountBalances,
        /** Each credit card with something owed, as a positive amount. */
        List<AccountAmount> cardBalances,
        List<CommitmentAmount> openInstances,
        String incompleteReason,
        List<IncompleteBlocker> blockers
) {
    public record AccountAmount(Long accountId, String name, BigDecimal balance) {
    }

    public record CommitmentAmount(Long commitmentInstanceId, String name, BigDecimal outstanding, boolean mandatory) {
    }

    public record IncompleteBlocker(Long commitmentInstanceId, String name, String fix) {
    }
}
