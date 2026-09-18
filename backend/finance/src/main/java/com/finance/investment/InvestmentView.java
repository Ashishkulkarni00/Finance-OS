package com.finance.investment;

import com.finance.account.domain.Account;
import com.finance.investment.domain.Investment;

import java.math.BigDecimal;

/**
 * A holding plus the accounts it touches and everything derived from them.
 *
 * @param account        the INVESTMENT account it's held in, or null when tracked
 *                       outside the ledger
 * @param payFromAccount where the contribution comes from, or null
 * @param openingInvested what had gone in before tracking began - the account's own
 *                       opening balance, or the stated figure when there's no account
 * @param addedSince     contributions recorded since. Null without an account: nothing
 *                       was recorded, so there is no figure, and zero would claim
 *                       otherwise
 * @param totalInvested  what has gone in altogether - the account's live balance, which
 *                       is derived from real postings rather than stored and re-derived
 * @param gain           {@code currentValue - totalInvested}. <strong>Null when the
 *                       holding has never been valued</strong> - the workbook's "Not
 *                       updated", and the reason this type exists
 * @param gainPercent    the same, as a fraction (0.08 is 8%), never pre-multiplied -
 *                       same convention as {@code savingsRate}. Null on the same terms,
 *                       and also when nothing has gone in to take a share of
 * @param valuationAgeDays how long ago the value was set, so a stale figure can say so.
 *                       Null when never valued
 */
public record InvestmentView(
        Investment investment,
        Account account,
        Account payFromAccount,
        BigDecimal openingInvested,
        BigDecimal addedSince,
        BigDecimal totalInvested,
        BigDecimal gain,
        BigDecimal gainPercent,
        Integer valuationAgeDays,
        /** The plan bill that pays this holding's instalment, or null. */
        Long planCommitmentId
) {
}
