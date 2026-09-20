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
        if ((kind == TransactionType.INVESTMENT || kind == TransactionType.TRANSFER)
                && !accountService.getByIdIncludingDeleted(commitment.getAccountId()).countsAsSpendable()) {
            return CommitmentBucket.NEITHER;
        }
        if (kind == TransactionType.INVESTMENT) {
            return CommitmentBucket.SET_ASIDE;
        }
        if (kind == TransactionType.TRANSFER) {
            Account to = accountService.getByIdIncludingDeleted(commitment.getToAccountId());
            if (to.getType() == AccountType.CREDIT_CARD || to.getType() == AccountType.LOAN) {
                return CommitmentBucket.PAYMENT;   // paying a debt is spoken-for money
            }
            return to.countsAsSpendable() ? CommitmentBucket.NEITHER : CommitmentBucket.SET_ASIDE;
        }
        return CommitmentBucket.PAYMENT;
    }
}
