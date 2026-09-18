package com.finance.commitment;

import com.finance.account.domain.Account;
import com.finance.category.domain.Category;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.transaction.TransactionView;

import java.util.List;

/** Everything {@code CommitmentMapper.toDetailResponse} needs, gathered by the service. */
public record CommitmentInstanceDetailView(
        CommitmentInstance instance,
        Commitment commitment,
        Account account,
        Category category,
        TransactionView linkedTransaction,
        List<CommitmentInstance> history
) {
}
