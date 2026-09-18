package com.finance.transaction;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.category.CategoryService;
import com.finance.category.domain.Category;
import com.finance.category.domain.CategoryGroup;
import com.finance.commitment.CommitmentAutoMatcher;
import com.finance.cycle.CycleService;
import com.finance.cycle.domain.Cycle;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.idempotency.IdempotencyService;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.transaction.domain.Transaction;
import com.finance.transaction.domain.TransactionType;
import com.finance.transaction.dto.CreateTransactionRequest;
import com.finance.transaction.dto.UpdateTransactionRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Business rules for transactions - the core money-integrity work of milestone 2.
 *
 * <p>Every write goes through {@link PostingFactory} so double-entry postings are
 * generated in exactly one place, and every write revalidates the type-driven rules
 * (destination required/forbidden, category required/forbidden, distinct accounts)
 * against whatever the effective state ends up being after the request is applied.
 */
@Service
public class TransactionServiceImpl implements TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionServiceImpl.class);

    private final TransactionRepository repository;
    private final PostingRepository postingRepository;
    private final PostingFactory postingFactory;
    private final TransactionMapper mapper;
    private final AccountService accountService;
    private final CategoryService categoryService;
    private final IdempotencyService idempotencyService;
    private final CommitmentAutoMatcher commitmentAutoMatcher;
    private final CurrentUserProvider currentUser;
    private final CycleService cycleService;

    public TransactionServiceImpl(TransactionRepository repository,
                                  PostingRepository postingRepository,
                                  PostingFactory postingFactory,
                                  TransactionMapper mapper,
                                  AccountService accountService,
                                  CategoryService categoryService,
                                  IdempotencyService idempotencyService,
                                  CommitmentAutoMatcher commitmentAutoMatcher,
                                  CurrentUserProvider currentUser,
                                  CycleService cycleService) {
        this.repository = repository;
        this.postingRepository = postingRepository;
        this.postingFactory = postingFactory;
        this.mapper = mapper;
        this.accountService = accountService;
        this.categoryService = categoryService;
        this.idempotencyService = idempotencyService;
        this.commitmentAutoMatcher = commitmentAutoMatcher;
        this.currentUser = currentUser;
        this.cycleService = cycleService;
    }

    @Override
    @Transactional
    public TransactionView create(CreateTransactionRequest request, String idempotencyKey) {
        Long userId = currentUser.currentUserId();

        Optional<Long> replay = idempotencyService.findExistingTransaction(
                userId, idempotencyKey, request.toString());
        if (replay.isPresent()) {
            log.info("Transaction replayed via idempotency key, id={}", replay.get());
            return loadView(replay.get());
        }

        Account account = requireActiveAccount(request.accountId(), "accountId");
        requireEligibleSource(request.type(), account);

        Account toAccount = null;
        if (request.type().requiresDestination()) {
            if (request.toAccountId() == null) {
                throw new BusinessRuleException(ErrorCode.DESTINATION_REQUIRED,
                        "Where did the money go? This needs a destination account.", "toAccountId");
            }
            if (Objects.equals(request.toAccountId(), request.accountId())) {
                throw new BusinessRuleException(ErrorCode.TRANSFER_SAME_ACCOUNT,
                        "Money can't move from an account to itself.", "toAccountId");
            }
            toAccount = requireActiveAccount(request.toAccountId(), "toAccountId");
            requireEligibleDestination(request.type(), toAccount);
        } else if (request.toAccountId() != null) {
            throw new BusinessRuleException(ErrorCode.DESTINATION_NOT_ALLOWED,
                    "A " + request.type().name().toLowerCase() + " doesn't have a destination account.",
                    "toAccountId");
        }

        Category category = null;
        if (request.type().requiresCategory()) {
            if (request.categoryId() == null) {
                throw new BusinessRuleException(ErrorCode.CATEGORY_REQUIRED,
                        "Choose a category for this transaction.", "categoryId");
            }
            category = requireActiveCategory(request.categoryId());
            requireCategoryDirection(request.type(), category);
        } else if (request.categoryId() != null) {
            throw new BusinessRuleException(ErrorCode.CATEGORY_NOT_ALLOWED,
                    "A " + request.type().name().toLowerCase() + " isn't categorised as spending.",
                    "categoryId");
        }

        Transaction saved = repository.save(mapper.toEntity(request, userId));
        postingRepository.saveAll(postingFactory.build(saved));
        commitmentAutoMatcher.tryMatch(saved);

        idempotencyService.record(userId, idempotencyKey, request.toString(), saved.getId());

        // Ids and types only - never amounts or descriptions. See ADR-0010.
        log.info("Transaction created id={} type={}", saved.getId(), saved.getType());
        return new TransactionView(saved, account, toAccount, category);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionView getById(Long id) {
        return loadView(requireOwned(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, LocalDate> datesByIds(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return repository.findDatesByIds(ids, currentUser.currentUserId()).stream()
                .collect(Collectors.toMap(TransactionDateProjection::getId, TransactionDateProjection::getDate));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionView> search(Long accountId, Long categoryId, TransactionType type,
                                        LocalDate dateFrom, LocalDate dateTo, Pageable pageable) {
        return repository.search(currentUser.currentUserId(), accountId, categoryId, type,
                dateFrom, dateTo, null, pageable).map(this::loadView);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionView> search(Long accountId, Long categoryId, TransactionType type,
                                        Long cycleId, LocalDate dateFrom, LocalDate dateTo, String q,
                                        Pageable pageable) {
        LocalDate[] range = resolveRange(cycleId, dateFrom, dateTo);
        return repository.search(currentUser.currentUserId(), accountId, categoryId, type,
                range[0], range[1], likePattern(q), pageable).map(this::loadView);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionViewSummary viewSummary(Long accountId, Long categoryId, TransactionType type,
                                              Long cycleId, LocalDate dateFrom, LocalDate dateTo, String q) {
        LocalDate[] range = resolveRange(cycleId, dateFrom, dateTo);
        TransactionViewSummaryProjection row = repository.viewSummary(currentUser.currentUserId(),
                accountId, categoryId, type, range[0], range[1], likePattern(q));
        return new TransactionViewSummary(
                MoneyScale.normalise(row.getMoneyIn()), MoneyScale.normalise(row.getMoneyOut()),
                MoneyScale.normalise(row.getTransferred()), (int) row.getEntryCount());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DaySubtotal> daySubtotals(Long accountId, Long categoryId, TransactionType type,
                                          Long cycleId, LocalDate dateFrom, LocalDate dateTo, String q) {
        LocalDate[] range = resolveRange(cycleId, dateFrom, dateTo);
        return repository.daySubtotals(currentUser.currentUserId(), accountId, categoryId, type,
                        range[0], range[1], likePattern(q))
                .stream()
                .map(row -> new DaySubtotal(row.getDate(), MoneyScale.normalise(row.getMoneyIn()),
                        MoneyScale.normalise(row.getMoneyOut()), MoneyScale.normalise(row.getTransferred())))
                .toList();
    }

    /** A cycle id takes precedence over an explicit range - the two aren't meant to be
     *  combined (LEDGER_UX_SPEC.md §1). Returns {@code [from, to]}, either of which may
     *  be null (no lower/upper bound). */
    private LocalDate[] resolveRange(Long cycleId, LocalDate dateFrom, LocalDate dateTo) {
        if (cycleId == null) {
            return new LocalDate[] { dateFrom, dateTo };
        }
        Cycle cycle = cycleService.getById(cycleId);
        return new LocalDate[] { cycle.getStartDate(), cycle.getEndDate() };
    }

    /** Lowercased, wildcard-wrapped for the repository's `like` - or null, which the
     *  query treats as "no search text" rather than matching nothing. */
    private String likePattern(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        return "%" + q.trim().toLowerCase() + "%";
    }

    @Override
    @Transactional
    public TransactionView update(Long id, UpdateTransactionRequest request) {
        Transaction tx = requireOwned(id);

        if (request.date() != null) {
            tx.setDate(request.date());
        }
        if (request.description() != null) {
            String description = request.description().trim();
            if (description.isEmpty()) {
                throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                        "A transaction needs a description you'll recognise.", "description");
            }
            tx.setDescription(description);
        }
        if (request.type() != null) {
            tx.setType(request.type());
        }
        if (request.amount() != null) {
            tx.setAmount(MoneyScale.normalise(request.amount()));
        }
        if (request.accountId() != null) {
            tx.setAccountId(request.accountId());
        }
        if (request.toAccountId() != null) {
            tx.setToAccountId(request.toAccountId());
        }
        if (request.categoryId() != null) {
            tx.setCategoryId(request.categoryId());
        }
        if (request.merchant() != null) {
            tx.setMerchant(blankToNull(request.merchant()));
        }
        if (request.note() != null) {
            tx.setNote(blankToNull(request.note()));
        }

        // A PATCH cannot express "clear this field" - so a type change that no longer
        // needs a destination/category drops it here rather than requiring the caller
        // to know to null it out explicitly.
        if (!tx.getType().requiresDestination()) {
            tx.setToAccountId(null);
        }
        if (!tx.getType().requiresCategory()) {
            tx.setCategoryId(null);
        }

        Account account = requireActiveAccount(tx.getAccountId(), "accountId");
        requireEligibleSource(tx.getType(), account);

        Account toAccount = null;
        if (tx.getType().requiresDestination()) {
            if (tx.getToAccountId() == null) {
                throw new BusinessRuleException(ErrorCode.DESTINATION_REQUIRED,
                        "Where did the money go? This needs a destination account.", "toAccountId");
            }
            if (Objects.equals(tx.getToAccountId(), tx.getAccountId())) {
                throw new BusinessRuleException(ErrorCode.TRANSFER_SAME_ACCOUNT,
                        "Money can't move from an account to itself.", "toAccountId");
            }
            toAccount = requireActiveAccount(tx.getToAccountId(), "toAccountId");
            requireEligibleDestination(tx.getType(), toAccount);
        }

        Category category = null;
        if (tx.getType().requiresCategory()) {
            if (tx.getCategoryId() == null) {
                throw new BusinessRuleException(ErrorCode.CATEGORY_REQUIRED,
                        "Choose a category for this transaction.", "categoryId");
            }
            category = requireActiveCategory(tx.getCategoryId());
            requireCategoryDirection(tx.getType(), category);
        }

        Transaction saved = repository.save(tx);
        postingRepository.deleteByTransactionId(saved.getId());
        postingRepository.saveAll(postingFactory.build(saved));

        log.info("Transaction updated id={}", saved.getId());
        return new TransactionView(saved, account, toAccount, category);
    }

    /** Soft delete. Financial records are never removed from the database. See ADR-0004. */
    @Override
    @Transactional
    public void delete(Long id) {
        Transaction tx = requireOwned(id);
        tx.markDeleted();
        repository.save(tx);
        log.info("Transaction soft-deleted id={}", id);
    }

    private TransactionView loadView(Long transactionId) {
        return loadView(requireOwned(transactionId));
    }

    private TransactionView loadView(Transaction tx) {
        Account account = accountService.getByIdIncludingDeleted(tx.getAccountId());
        Account toAccount = tx.getToAccountId() == null
                ? null : accountService.getByIdIncludingDeleted(tx.getToAccountId());
        Category category = tx.getCategoryId() == null
                ? null : categoryService.getByIdIncludingDeleted(tx.getCategoryId());
        return new TransactionView(tx, account, toAccount, category);
    }

    private Transaction requireOwned(Long id) {
        return repository.findByIdAndUserIdAndDeletedAtIsNull(id, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TRANSACTION_NOT_FOUND,
                        "We couldn't find that transaction. It may have been deleted."));
    }

    private Account requireActiveAccount(Long id, String field) {
        Account account = accountService.getById(id);
        if (account.isArchived()) {
            throw new BusinessRuleException(ErrorCode.ACCOUNT_ARCHIVED,
                    "That account is archived. Unarchive it first, or choose a different account.", field);
        }
        return account;
    }

    /** LEDGER_IMPROVEMENT_PLAN §2 P1 - confirmed the API accepted an EXPENSE against a
     *  LOAN account until this existed. Named for the actual account and type involved,
     *  not a generic "invalid account" - the whole point of a field-level error. */
    private void requireEligibleSource(TransactionType type, Account account) {
        if (!type.acceptsSource(account.getType())) {
            throw new BusinessRuleException(ErrorCode.ACCOUNT_NOT_ELIGIBLE,
                    "%s isn't something you can %s - it's a %s.".formatted(
                            account.getName(), verbFor(type), humaniseType(account.getType())),
                    "accountId");
        }
    }

    private void requireEligibleDestination(TransactionType type, Account account) {
        if (!type.acceptsDestination(account.getType())) {
            // "this transfer"/"this investment" rather than "a %s" - avoids an a/an
            // agreement bug for whichever type word lands there ("a investment").
            throw new BusinessRuleException(ErrorCode.DESTINATION_NOT_ELIGIBLE,
                    "%s isn't a valid destination for this %s - choose a different account.".formatted(
                            account.getName(), type.name().toLowerCase()),
                    "toAccountId");
        }
    }

    /** LEDGER_IMPROVEMENT_PLAN §2 P2 - "Salary Credit" was seeded into FLEXIBLE because
     *  no income group existed. INCOME requires an income category; EXPENSE and REFUND
     *  forbid one, so a refund reverses the expense category it came from rather than
     *  quietly becoming unrelated income. */
    private void requireCategoryDirection(TransactionType type, Category category) {
        boolean isIncomeCategory = category.getGroup() == CategoryGroup.INCOME;
        if (type == TransactionType.INCOME && !isIncomeCategory) {
            throw new BusinessRuleException(ErrorCode.CATEGORY_WRONG_DIRECTION,
                    "\"" + category.getName() + "\" is a spending category - income needs one from Income.",
                    "categoryId");
        }
        if (type != TransactionType.INCOME && isIncomeCategory) {
            throw new BusinessRuleException(ErrorCode.CATEGORY_WRONG_DIRECTION,
                    "\"" + category.getName() + "\" is an income category - this isn't income.",
                    "categoryId");
        }
    }

    private String verbFor(TransactionType type) {
        return switch (type) {
            case EXPENSE -> "spend from";
            case INCOME, REFUND -> "receive into";
            case TRANSFER, INVESTMENT -> "move money from";
        };
    }

    /** "CREDIT_CARD" -> "credit card". Plain language in an error a user reads, never SCREAMING_CASE. */
    private String humaniseType(AccountType type) {
        return type.name().toLowerCase().replace('_', ' ');
    }

    private Category requireActiveCategory(Long id) {
        Category category = categoryService.getById(id);
        if (category.isArchived()) {
            throw new BusinessRuleException(ErrorCode.CATEGORY_ARCHIVED,
                    "That category is archived. Unarchive it first, or choose a different category.",
                    "categoryId");
        }
        return category;
    }

    private String blankToNull(String value) {
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
