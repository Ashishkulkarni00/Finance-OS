package com.finance.commitment;

import com.finance.account.domain.Account;
import com.finance.category.domain.Category;
import com.finance.commitment.domain.Commitment;

public record CommitmentView(Commitment commitment, Account account, Category category) {
}
