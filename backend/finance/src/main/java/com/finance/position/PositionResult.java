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
        BigDecimal roomToday,
        BigDecimal roomLeft,
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
