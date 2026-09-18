package com.finance.transaction;

import com.finance.account.domain.Account;
import com.finance.category.domain.Category;
import com.finance.transaction.domain.Transaction;

/**
 * A transaction plus the account/category rows its summary needs to render.
 *
 * <p>Not a DTO - {@code TransactionMapper} still owns entity-to-response shaping.
 * This exists so the service (which already fetched these rows to validate the
 * request, or must resolve them to render a historical row) hands the mapper
 * everything it needs in one call, keeping the mapper itself free of repository or
 * service access. {@code toAccount} and {@code category} are null when not applicable
 * to the transaction's type.
 */
public record TransactionView(Transaction transaction, Account account, Account toAccount, Category category) {
}
