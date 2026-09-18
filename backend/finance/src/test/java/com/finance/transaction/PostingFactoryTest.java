package com.finance.transaction;

import com.finance.transaction.domain.Transaction;
import com.finance.transaction.domain.TransactionType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The double-entry generator. These tests protect the single invariant the whole
 * product depends on: postings always sum to zero, so the same rupee cannot be
 * counted twice. See domain rule 1 and {@code TECHNICAL_ARCHITECTURE.md} §5.
 */
class PostingFactoryTest {

    private static final Long USER_ID = 1L;
    private static final Long ACCOUNT_ID = 10L;
    private static final Long TO_ACCOUNT_ID = 20L;

    private final PostingFactory factory = new PostingFactory();

    private Transaction transaction(TransactionType type, Long toAccountId) {
        return Transaction.builder()
                .id(100L)
                .userId(USER_ID)
                .date(LocalDate.of(2026, 9, 9))
                .type(type)
                .description("Test")
                .amount(new BigDecimal("100.00"))
                .accountId(ACCOUNT_ID)
                .toAccountId(toAccountId)
                .build();
    }

    @ParameterizedTest(name = "{0}")
    @DisplayName("a two-account movement (TRANSFER/INVESTMENT) always sums to zero")
    @EnumSource(value = TransactionType.class, names = {"TRANSFER", "INVESTMENT"})
    void twoAccountMovementsSumToZero(TransactionType type) {
        List<com.finance.transaction.domain.Posting> postings = factory.build(transaction(type, TO_ACCOUNT_ID));

        BigDecimal sum = postings.stream()
                .map(com.finance.transaction.domain.Posting::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(postings).hasSize(2);
        assertThat(sum).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @ParameterizedTest(name = "{0}")
    @DisplayName("a single-account movement (INCOME/EXPENSE/REFUND) is one posting - nothing to balance against")
    @EnumSource(value = TransactionType.class, names = {"INCOME", "EXPENSE", "REFUND"})
    void singleAccountMovementsAreOnePosting(TransactionType type) {
        List<com.finance.transaction.domain.Posting> postings = factory.build(transaction(type, null));

        assertThat(postings).hasSize(1);
        assertThat(postings.get(0).getAccountId()).isEqualTo(ACCOUNT_ID);
    }

    @Test
    @DisplayName("INCOME posts a single positive entry against the account")
    void income() {
        var postings = factory.build(transaction(TransactionType.INCOME, null));

        assertThat(postings).hasSize(1);
        assertThat(postings.get(0).getAccountId()).isEqualTo(ACCOUNT_ID);
        assertThat(postings.get(0).getAmount()).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("EXPENSE posts a single negative entry against the account")
    void expense() {
        var postings = factory.build(transaction(TransactionType.EXPENSE, null));

        assertThat(postings).hasSize(1);
        assertThat(postings.get(0).getAccountId()).isEqualTo(ACCOUNT_ID);
        assertThat(postings.get(0).getAmount()).isEqualByComparingTo("-100.00");
    }

    @Test
    @DisplayName("REFUND posts a single positive entry, same shape as income")
    void refund() {
        var postings = factory.build(transaction(TransactionType.REFUND, null));

        assertThat(postings).hasSize(1);
        assertThat(postings.get(0).getAmount()).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("TRANSFER posts a negative leg on the source and a positive leg on the destination")
    void transfer() {
        var postings = factory.build(transaction(TransactionType.TRANSFER, TO_ACCOUNT_ID));

        assertThat(postings).hasSize(2);
        assertThat(postings)
                .anySatisfy(p -> {
                    assertThat(p.getAccountId()).isEqualTo(ACCOUNT_ID);
                    assertThat(p.getAmount()).isEqualByComparingTo("-100.00");
                })
                .anySatisfy(p -> {
                    assertThat(p.getAccountId()).isEqualTo(TO_ACCOUNT_ID);
                    assertThat(p.getAmount()).isEqualByComparingTo("100.00");
                });
    }

    @Test
    @DisplayName("INVESTMENT has the same shape as a transfer - money leaving is never an expense")
    void investment() {
        var postings = factory.build(transaction(TransactionType.INVESTMENT, TO_ACCOUNT_ID));

        assertThat(postings).hasSize(2);
        assertThat(postings).noneMatch(p -> p.getAmount().signum() == 0);
    }

    @Test
    @DisplayName("every posting carries the transaction's user id, denormalised")
    void postingsCarryUserId() {
        var postings = factory.build(transaction(TransactionType.TRANSFER, TO_ACCOUNT_ID));

        assertThat(postings).allSatisfy(p -> assertThat(p.getUserId()).isEqualTo(USER_ID));
    }

    @Test
    @DisplayName("every posting references its transaction")
    void postingsReferenceTransaction() {
        var postings = factory.build(transaction(TransactionType.EXPENSE, null));

        assertThat(postings).allSatisfy(p -> assertThat(p.getTransactionId()).isEqualTo(100L));
    }
}
