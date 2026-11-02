package com.finance.commitment;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.commitment.domain.Commitment;
import com.finance.transaction.domain.TransactionType;
import org.springframework.stereotype.Component;

/**
 * Which bucket a bill's money falls into, from how it's paid ({@code settleAs}) and, for a
 * transfer or investment, where it goes. Extracted from {@code CommitmentInstanceServiceImpl}
 * (2026-09-19) so the current month's shape, its review, and the forward-looking forecast
 * all classify a bill the same way - one rule engine, not three that could drift apart.
 */
@Component
public class CommitmentBucketClassifier {

    private final AccountService accountService;

    public CommitmentBucketClassifier(AccountService accountService) {
        this.accountService = accountService;
    }

    public CommitmentBucket classify(Commitment commitment) {
        TransactionType kind = commitment.getSettleAs();
        if (kind == TransactionType.INCOME) {
            return CommitmentBucket.INCOME;
        }
        // Money moved or invested out of an account that isn't spending money (cash kept for
        // the emergency fund) was set aside already - it isn't taken from this month's income.
        //
        // **Plan, and known to be the wrong choice here - FIX_BACKLOG 1.11, not yet fixed.**
        // This reads the *planned* source, so the answer changes when an account's
        // spendability changes: flipping Cash wallet to "spending money" on 2026-10-03 moved a
        // ₹15,000 top-up into `plannedSavings` and took "Free this month" down by that much,
        // retroactively and with no warning. The honest source is the account each payment
        // actually left, which `CommitmentSourceResolver` supplies.
        //
        // It is not simply switched because this classifier is shared with {@code CycleReview},
        // where changing it would restate **closed** cycles - and a closed cycle is a
        // historical fact, not a cache (CLAUDE.md rule 1). That question is open; until it is
        // answered this stays as it is rather than being half-changed.
        if ((kind == TransactionType.INVESTMENT || kind == TransactionType.TRANSFER)
                && !accountService.getByIdIncludingDeleted(commitment.getAccountId()).countsAsSpendable()) {
            return CommitmentBucket.NEITHER;
        }
        if (kind == TransactionType.INVESTMENT) {
            return CommitmentBucket.SET_ASIDE;
        }
        if (kind == TransactionType.TRANSFER) {
            // **Plan, and correct.** A destination is not a guess: `settle` enforces it, so
            // money that arrived somewhere else did not pay this bill (M1 register).
            Account to = accountService.getByIdIncludingDeleted(commitment.getToAccountId());
            if (to.getType() == AccountType.CREDIT_CARD || to.getType() == AccountType.LOAN) {
                return CommitmentBucket.PAYMENT;   // paying a debt is spoken-for money
            }
            return to.countsAsSpendable() ? CommitmentBucket.NEITHER : CommitmentBucket.SET_ASIDE;
        }
        return CommitmentBucket.PAYMENT;
    }
}
