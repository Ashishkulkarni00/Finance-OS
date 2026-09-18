package com.finance.transaction;

import com.finance.transaction.domain.TransactionType;
import com.finance.transaction.dto.CreateTransactionRequest;
import com.finance.transaction.dto.UpdateTransactionRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/** Transaction use cases - the core money-integrity work of milestone 2. */
public interface TransactionService {

    /**
     * @param idempotencyKey optional; a repeated key with the same request replays
     *                       the original result instead of creating a duplicate
     */
    TransactionView create(CreateTransactionRequest request, String idempotencyKey);

    TransactionView getById(Long id);

    /**
     * The dates of several transactions at once, for callers that need only "when did
     * this money move" and not the whole view. One query instead of N - a commitment
     * list asking {@code getById} per settled row would fan out into four lookups each.
     * Ids that are missing or not the caller's are simply absent from the map.
     */
    Map<Long, LocalDate> datesByIds(Collection<Long> ids);

    Page<TransactionView> search(Long accountId, Long categoryId, TransactionType type,
                                 LocalDate dateFrom, LocalDate dateTo, Pageable pageable);

    /**
     * The Ledger's filtered list. {@code cycleId}, when given, resolves to that cycle's
     * date range and takes precedence over {@code dateFrom}/{@code dateTo} - the two are
     * not meant to be combined (LEDGER_UX_SPEC.md §1: the URL's {@code cycle} chip is
     * either a cycle id or "all"). {@code q} matches against description and merchant,
     * case-insensitively.
     */
    Page<TransactionView> search(Long accountId, Long categoryId, TransactionType type,
                                 Long cycleId, LocalDate dateFrom, LocalDate dateTo, String q,
                                 Pageable pageable);

    /** Same filters as the search above, collapsed to one total - see {@link TransactionViewSummary}. */
    TransactionViewSummary viewSummary(Long accountId, Long categoryId, TransactionType type,
                                       Long cycleId, LocalDate dateFrom, LocalDate dateTo, String q);

    /** Same filters, one row per day - see {@link DaySubtotal}. */
    List<DaySubtotal> daySubtotals(Long accountId, Long categoryId, TransactionType type,
                                   Long cycleId, LocalDate dateFrom, LocalDate dateTo, String q);

    TransactionView update(Long id, UpdateTransactionRequest request);

    void delete(Long id);
}
