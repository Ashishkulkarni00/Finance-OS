package com.finance.transaction;

import com.finance.transaction.domain.Posting;
import com.finance.transaction.domain.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Data access for postings.
 *
 * <p>Postings are never queried on their own for balance purposes without also
 * joining to their transaction, so that a soft-deleted transaction's postings drop
 * out of every total without needing their own delete flag. See {@code Posting}'s
 * class comment.
 */
public interface PostingRepository extends JpaRepository<Posting, Long> {

    List<Posting> findByTransactionId(Long transactionId);

    void deleteByTransactionId(Long transactionId);

    /**
     * Sum of postings against one account, dated after {@code openingAsOf}, excluding
     * postings whose transaction has been soft-deleted. This is the seam
     * {@code AccountBalanceCalculator} was left for in milestone 1. See ADR-0011.
     */
    @Query("""
            select coalesce(sum(p.amount), 0.00) from Posting p, Transaction t
            where p.transactionId = t.id
              and p.accountId = :accountId
              and p.userId = :userId
              and t.deletedAt is null
              and t.date > :openingAsOf
            """)
    BigDecimal sumPostingsForAccount(@Param("accountId") Long accountId,
                                     @Param("userId") Long userId,
                                     @Param("openingAsOf") LocalDate openingAsOf);

    /** Postings dated after {@code after} and on or before {@code upTo} - a balance as at a
     *  past date, e.g. what a card owed at the end of its statement date. */
    @Query("""
            select coalesce(sum(p.amount), 0.00) from Posting p, Transaction t
            where p.transactionId = t.id
              and p.accountId = :accountId
              and p.userId = :userId
              and t.deletedAt is null
              and t.date > :after
              and t.date <= :upTo
            """)
    BigDecimal sumPostingsForAccountBetween(@Param("accountId") Long accountId,
                                            @Param("userId") Long userId,
                                            @Param("after") LocalDate after,
                                            @Param("upTo") LocalDate upTo);

    /** Money in to an account after a date - on a card, payments and refunds since a statement. */
    @Query("""
            select coalesce(sum(p.amount), 0.00) from Posting p, Transaction t
            where p.transactionId = t.id
              and p.accountId = :accountId
              and p.userId = :userId
              and t.deletedAt is null
              and t.date > :after
              and p.amount > 0
            """)
    BigDecimal sumCreditsForAccountAfter(@Param("accountId") Long accountId,
                                         @Param("userId") Long userId,
                                         @Param("after") LocalDate after);

    /** Money out of an account after a date (negative) - on a card, what's been spent since a statement. */
    @Query("""
            select coalesce(sum(p.amount), 0.00) from Posting p, Transaction t
            where p.transactionId = t.id
              and p.accountId = :accountId
              and p.userId = :userId
              and t.deletedAt is null
              and t.date > :after
              and p.amount < 0
            """)
    BigDecimal sumDebitsForAccountAfter(@Param("accountId") Long accountId,
                                        @Param("userId") Long userId,
                                        @Param("after") LocalDate after);
}
