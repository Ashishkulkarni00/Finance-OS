package com.finance.transaction;

import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.transaction.domain.Posting;
import com.finance.transaction.domain.Transaction;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Turns a {@link Transaction} into the postings that make it real.
 *
 * <p>This is the one place postings are generated, and the two shapes here are
 * deliberately different:
 *
 * <ul>
 *   <li><strong>{@code TRANSFER}/{@code INVESTMENT}</strong> move money between two
 *       of the user's own tracked accounts - true double-entry, two postings that sum
 *       to zero, enforced defensively below.</li>
 *   <li><strong>{@code INCOME}/{@code EXPENSE}/{@code REFUND}</strong> represent money
 *       crossing the boundary of what this ledger tracks (a salary source, a merchant)
 *       - a single posting, nothing to balance against. This matches
 *       {@code DOMAIN_MODEL.md} §2's posting table exactly (e.g. {@code INCOME: +account}).</li>
 * </ul>
 *
 * <p>{@code DOMAIN_MODEL.md} §4 rule 1 ("postings for a transaction sum to zero") is
 * imprecise as a blanket statement - it holds for the two-account case, not the
 * single-account case, and the doc should be read alongside its own posting table,
 * not the rule in isolation. See ADR note in the M2 changelog for the correction.
 */
@Component
public class PostingFactory {

    public List<Posting> build(Transaction transaction) {
        BigDecimal amount = transaction.getAmount();
        return switch (transaction.getType()) {
            case INCOME, REFUND -> List.of(
                    posting(transaction, transaction.getAccountId(), amount));

            case EXPENSE -> List.of(
                    posting(transaction, transaction.getAccountId(), amount.negate()));

            case TRANSFER, INVESTMENT -> balancedPair(transaction, amount);
        };
    }

    /** The only shape where "sum to zero" is a real invariant - defended here. */
    private List<Posting> balancedPair(Transaction transaction, BigDecimal amount) {
        List<Posting> postings = List.of(
                posting(transaction, transaction.getAccountId(), amount.negate()),
                posting(transaction, transaction.getToAccountId(), amount));

        BigDecimal sum = postings.stream().map(Posting::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (sum.compareTo(BigDecimal.ZERO) != 0) {
            throw new BusinessRuleException(ErrorCode.POSTINGS_UNBALANCED,
                    "This transaction doesn't balance. Please try again.");
        }
        return postings;
    }

    private Posting posting(Transaction transaction, Long accountId, BigDecimal amount) {
        return Posting.builder()
                .transactionId(transaction.getId())
                .userId(transaction.getUserId())
                .accountId(accountId)
                .amount(amount)
                .createdAt(Instant.now())
                .build();
    }
}
