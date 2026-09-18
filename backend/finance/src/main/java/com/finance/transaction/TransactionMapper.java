package com.finance.transaction;

import com.finance.account.AccountMapper;
import com.finance.account.domain.Account;
import com.finance.category.CategoryMapper;
import com.finance.category.domain.Category;
import com.finance.common.money.MoneyScale;
import com.finance.transaction.domain.Transaction;
import com.finance.transaction.dto.CreateTransactionRequest;
import com.finance.transaction.dto.DaySubtotalResponse;
import com.finance.transaction.dto.TransactionResponse;
import com.finance.transaction.dto.TransactionViewSummaryResponse;
import org.springframework.stereotype.Component;

/**
 * Entity to DTO, by hand - see the rationale on {@code AccountMapper}.
 *
 * <p>Pure: the {@code Account}/{@code Category} objects needed for the nested
 * summaries are resolved by the service (which already fetched them to validate the
 * request) and handed in here, never fetched by the mapper itself.
 */
@Component
public class TransactionMapper {

    private final AccountMapper accountMapper;
    private final CategoryMapper categoryMapper;

    public TransactionMapper(AccountMapper accountMapper, CategoryMapper categoryMapper) {
        this.accountMapper = accountMapper;
        this.categoryMapper = categoryMapper;
    }

    public Transaction toEntity(CreateTransactionRequest request, Long userId) {
        return Transaction.builder()
                .userId(userId)
                .date(request.date())
                .type(request.type())
                .description(request.description().trim())
                .amount(MoneyScale.normalise(request.amount()))
                .accountId(request.accountId())
                .toAccountId(request.toAccountId())
                .categoryId(request.categoryId())
                .merchant(trimToNull(request.merchant()))
                .note(trimToNull(request.note()))
                .build();
    }

    public TransactionResponse toResponse(Transaction transaction, Account account, Account toAccount,
                                          Category category) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getDate(),
                transaction.getDescription(),
                transaction.getType(),
                humanise(transaction.getType()),
                transaction.getType().countsAsSpending(),
                transaction.getAmount(),
                accountMapper.toSummary(account),
                accountMapper.toSummary(toAccount),
                categoryMapper.toSummary(category),
                transaction.getMerchant(),
                transaction.getNote(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt()
        );
    }

    public TransactionViewSummaryResponse toResponse(TransactionViewSummary summary) {
        return new TransactionViewSummaryResponse(
                summary.moneyIn(), summary.moneyOut(), summary.transferred(), summary.entryCount());
    }

    public DaySubtotalResponse toResponse(DaySubtotal subtotal) {
        return new DaySubtotalResponse(subtotal.date(), subtotal.moneyIn(), subtotal.moneyOut(), subtotal.transferred());
    }

    /** "CREDIT_CARD" -> "Credit card". Labels are plain language, never SCREAMING_CASE. */
    private String humanise(com.finance.transaction.domain.TransactionType type) {
        String words = type.name().toLowerCase().replace('_', ' ');
        return Character.toUpperCase(words.charAt(0)) + words.substring(1);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
