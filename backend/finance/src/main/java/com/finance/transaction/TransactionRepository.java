package com.finance.transaction;

import com.finance.transaction.domain.Transaction;
import com.finance.transaction.domain.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Data access for transactions.
 *
 * <p>Every query filters by {@code userId} - see the isolation guarantee established
 * in {@code AccountRepository}.
 */
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    @Query("""
            select t.id as id, t.date as date from Transaction t
            where t.id in :ids
              and t.userId = :userId
              and t.deletedAt is null
            """)
    List<TransactionDateProjection> findDatesByIds(@Param("ids") Collection<Long> ids, @Param("userId") Long userId);

    /**
     * The Ledger's filtered list. A category filter includes that category's
     * sub-categories (V12): This Month's flexible spending folds "Fuel" and "Cab" into
     * "Transport", and its rows open this view pre-filtered to the category - so an
     * exact-match filter showed a list that no longer added up to the figure it was
     * opened from. {@link #viewSummary} and {@link #daySubtotals} share the predicate.
     */
    @Query("""
            select t from Transaction t
            where t.userId = :userId
              and t.deletedAt is null
              and (:accountId is null or t.accountId = :accountId or t.toAccountId = :accountId)
              and (:categoryId is null or t.categoryId = :categoryId
                   or t.categoryId in (select c.id from Category c
                                       where c.parentId = :categoryId and c.userId = :userId))
              and (:type is null or t.type = :type)
              and (:dateFrom is null or t.date >= :dateFrom)
              and (:dateTo is null or t.date <= :dateTo)
              and (:q is null or lower(t.description) like :q or lower(t.merchant) like :q)
            order by t.date desc, t.id desc
            """)
    Page<Transaction> search(@Param("userId") Long userId,
                             @Param("accountId") Long accountId,
                             @Param("categoryId") Long categoryId,
                             @Param("type") TransactionType type,
                             @Param("dateFrom") LocalDate dateFrom,
                             @Param("dateTo") LocalDate dateTo,
                             @Param("q") String q,
                             Pageable pageable);

    /**
     * The same predicate as {@link #search}, collapsed into one row - the Ledger's
     * "stated view" total (LEDGER_UX_SPEC.md §6.2). Separate from the page so paging
     * never changes the total: this describes the whole filtered view, not one page of it.
     */
    @Query("""
            select
                coalesce(sum(case when t.type in (com.finance.transaction.domain.TransactionType.INCOME,
                                                   com.finance.transaction.domain.TransactionType.REFUND)
                                  then t.amount else 0 end), 0.00) as moneyIn,
                coalesce(sum(case when t.type = com.finance.transaction.domain.TransactionType.EXPENSE
                                  then t.amount else 0 end), 0.00) as moneyOut,
                coalesce(sum(case when t.type in (com.finance.transaction.domain.TransactionType.TRANSFER,
                                                   com.finance.transaction.domain.TransactionType.INVESTMENT)
                                  then t.amount else 0 end), 0.00) as transferred,
                count(t) as entryCount
            from Transaction t
            where t.userId = :userId
              and t.deletedAt is null
              and (:accountId is null or t.accountId = :accountId or t.toAccountId = :accountId)
              and (:categoryId is null or t.categoryId = :categoryId
                   or t.categoryId in (select c.id from Category c
                                       where c.parentId = :categoryId and c.userId = :userId))
              and (:type is null or t.type = :type)
              and (:dateFrom is null or t.date >= :dateFrom)
              and (:dateTo is null or t.date <= :dateTo)
              and (:q is null or lower(t.description) like :q or lower(t.merchant) like :q)
            """)
    TransactionViewSummaryProjection viewSummary(@Param("userId") Long userId,
                                                  @Param("accountId") Long accountId,
                                                  @Param("categoryId") Long categoryId,
                                                  @Param("type") TransactionType type,
                                                  @Param("dateFrom") LocalDate dateFrom,
                                                  @Param("dateTo") LocalDate dateTo,
                                                  @Param("q") String q);

    /**
     * The same predicate as {@link #search}, one row per day - the Ledger's day-group
     * subtotals (LEDGER_UX_SPEC.md §2 Zone 4). Not paginated: grouping has to see every
     * matching row to be correct, which is safe at cycle scope (the default) and accepted
     * as a cost of an explicit "all time" view.
     */
    @Query("""
            select
                t.date as date,
                coalesce(sum(case when t.type in (com.finance.transaction.domain.TransactionType.INCOME,
                                                   com.finance.transaction.domain.TransactionType.REFUND)
                                  then t.amount else 0 end), 0.00) as moneyIn,
                coalesce(sum(case when t.type = com.finance.transaction.domain.TransactionType.EXPENSE
                                  then t.amount else 0 end), 0.00) as moneyOut,
                coalesce(sum(case when t.type in (com.finance.transaction.domain.TransactionType.TRANSFER,
                                                   com.finance.transaction.domain.TransactionType.INVESTMENT)
                                  then t.amount else 0 end), 0.00) as transferred
            from Transaction t
            where t.userId = :userId
              and t.deletedAt is null
              and (:accountId is null or t.accountId = :accountId or t.toAccountId = :accountId)
              and (:categoryId is null or t.categoryId = :categoryId
                   or t.categoryId in (select c.id from Category c
                                       where c.parentId = :categoryId and c.userId = :userId))
              and (:type is null or t.type = :type)
              and (:dateFrom is null or t.date >= :dateFrom)
              and (:dateTo is null or t.date <= :dateTo)
              and (:q is null or lower(t.description) like :q or lower(t.merchant) like :q)
            group by t.date
            order by t.date desc
            """)
    List<DaySubtotalProjection> daySubtotals(@Param("userId") Long userId,
                                             @Param("accountId") Long accountId,
                                             @Param("categoryId") Long categoryId,
                                             @Param("type") TransactionType type,
                                             @Param("dateFrom") LocalDate dateFrom,
                                             @Param("dateTo") LocalDate dateTo,
                                             @Param("q") String q);

    /**
     * Expenses on one account within a date window that no live bill occurrence is linked
     * to yet - the candidates when an occurrence is generated for a bill whose payment may
     * already have been recorded (see {@code CommitmentAutoMatcher.tryMatchExisting}).
     * "Unlinked" matters: an entry already paying another bill is never a second match.
     */
    @Query("""
            select t from Transaction t
            where t.userId = :userId
              and t.deletedAt is null
              and t.type = :type
              and t.accountId = :accountId
              and (:toAccountId is null or t.toAccountId = :toAccountId)
              and t.date between :from and :to
              and not exists (select ci.id from CommitmentInstance ci where ci.linkedTransactionId = t.id)
            order by t.date asc
            """)
    List<Transaction> findUnlinkedForMatch(@Param("userId") Long userId,
                                           @Param("type") com.finance.transaction.domain.TransactionType type,
                                           @Param("accountId") Long accountId,
                                           @Param("toAccountId") Long toAccountId,
                                           @Param("from") LocalDate from,
                                           @Param("to") LocalDate to);

    /** An exact match on account + amount + date - the seam import duplicate detection reads. */
    @Query("""
            select t from Transaction t
            where t.userId = :userId and t.deletedAt is null
              and t.accountId = :accountId and t.amount = :amount and t.date = :date
            """)
    java.util.List<Transaction> findPossibleDuplicates(@Param("userId") Long userId,
                                                        @Param("accountId") Long accountId,
                                                        @Param("amount") java.math.BigDecimal amount,
                                                        @Param("date") LocalDate date);

    /** Total of one type's amounts within a date range - the seam cycle summaries read. */
    @Query("""
            select coalesce(sum(t.amount), 0.00) from Transaction t
            where t.userId = :userId and t.deletedAt is null
              and t.type = :type and t.date between :from and :to
            """)
    java.math.BigDecimal sumAmountByTypeInRange(@Param("userId") Long userId,
                                                @Param("type") TransactionType type,
                                                @Param("from") LocalDate from,
                                                @Param("to") LocalDate to);

    /** Expense total per category within a date range, largest first - "where the money
     *  went this cycle". Categoryless expenses (there shouldn't be any - EXPENSE requires
     *  one) are excluded by the null check rather than silently grouped under "null". */
    @Query("""
            select t.categoryId as categoryId, coalesce(sum(t.amount), 0.00) as total
            from Transaction t
            where t.userId = :userId and t.deletedAt is null
              and t.type = :type
              and t.categoryId is not null
              and t.date between :from and :to
            group by t.categoryId
            order by sum(t.amount) desc
            """)
    java.util.List<CategorySpendProjection> sumByCategoryInRange(@Param("userId") Long userId,
                                                                  @Param("type") TransactionType type,
                                                                  @Param("from") LocalDate from,
                                                                  @Param("to") LocalDate to);
}
