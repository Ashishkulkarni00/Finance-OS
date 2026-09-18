package com.finance.commitment;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.category.CategoryService;
import com.finance.category.domain.Category;
import com.finance.commitment.domain.AttentionTier;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.commitment.dto.SettleCommitmentInstanceRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.CycleService;
import com.finance.cycle.domain.Cycle;
import com.finance.transaction.TransactionService;
import com.finance.transaction.TransactionView;
import com.finance.transaction.domain.TransactionType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class CommitmentInstanceServiceImpl implements CommitmentInstanceService {

    private static final Logger log = LoggerFactory.getLogger(CommitmentInstanceServiceImpl.class);

    private final CommitmentInstanceRepository repository;
    private final CommitmentRepository commitmentRepository;
    private final CommitmentInstanceGenerator generator;
    private final CommitmentSettlementCalculator calculator;
    private final CycleService cycleService;
    private final TransactionService transactionService;
    private final AccountService accountService;
    private final CategoryService categoryService;
    private final CurrentUserProvider currentUser;
    private final Clock clock;
    private final CommitmentAutoMatcher autoMatcher;

    public CommitmentInstanceServiceImpl(CommitmentInstanceRepository repository,
                                         CommitmentRepository commitmentRepository,
                                         CommitmentInstanceGenerator generator,
                                         CommitmentSettlementCalculator calculator,
                                         CycleService cycleService,
                                         TransactionService transactionService,
                                         AccountService accountService,
                                         CategoryService categoryService,
                                         CurrentUserProvider currentUser,
                                         Clock clock,
                                         CommitmentAutoMatcher autoMatcher) {
        this.repository = repository;
        this.commitmentRepository = commitmentRepository;
        this.generator = generator;
        this.calculator = calculator;
        this.cycleService = cycleService;
        this.transactionService = transactionService;
        this.accountService = accountService;
        this.categoryService = categoryService;
        this.currentUser = currentUser;
        this.clock = clock;
        this.autoMatcher = autoMatcher;
    }

    @Override
    @Transactional
    public List<CommitmentInstanceView> listForCycle(Long cycleId) {
        Long userId = currentUser.currentUserId();
        Cycle cycle = cycleService.getById(cycleId);

        List<Commitment> active = commitmentRepository.findActiveForCycle(userId, cycle.getStartDate(), cycle.getEndDate());
        for (Commitment commitment : active) {
            if (!generator.occursIn(commitment, cycle)) {
                continue;
            }
            boolean exists = repository.findByCommitmentIdAndCycleId(commitment.getId(), cycle.getId()).isPresent();
            if (!exists) {
                CommitmentInstance occurrence;
                // A retired occurrence for this rule and cycle is brought back rather than
                // re-inserted - the unique key still counts retired rows. See restoreRetired.
                if (repository.restoreRetired(commitment.getId(), cycle.getId()) > 0) {
                    occurrence = repository.findByCommitmentIdAndCycleId(commitment.getId(), cycle.getId()).orElseThrow();
                    log.info("Commitment instance restored id={} commitmentId={} cycleId={}",
                            occurrence.getId(), commitment.getId(), cycle.getId());
                } else {
                    occurrence = repository.save(generator.generate(commitment, cycle));
                    log.info("Commitment instance generated id={} commitmentId={} cycleId={}",
                            occurrence.getId(), commitment.getId(), cycle.getId());
                }
                // A bill added after it was paid already has its payment in the Ledger -
                // link it now, or the occurrence reads unpaid and settling it would count
                // the same money twice.
                autoMatcher.tryMatchExisting(occurrence);
            }
        }

        // Retire occurrences the generation rule says should never have existed. Before
        // CommitmentInstanceGenerator.occursIn checked the due date against the rule's
        // active window, a bill added mid-cycle was generated for a date before it
        // existed - immediately OVERDUE, and (with no amount) blocking Room for the whole
        // cycle. Fixing the generator stops new ones; this removes the ones already made.
        //
        // Deliberately narrow: only an occurrence nothing has touched - no payment linked,
        // nothing confirmed, still PENDING/OVERDUE. Anything the user has acted on is real
        // history and stays, whatever its date. Soft delete, so it remains recoverable.
        for (CommitmentInstance existing : repository.findByCycleIdAndUserId(cycle.getId(), userId)) {
            Commitment rule = commitmentRepository.findById(existing.getCommitmentId()).orElse(null);
            boolean untouched = existing.getLinkedTransactionId() == null
                    && existing.getConfirmedAmount() == null
                    && (existing.getStatus() == CommitmentInstanceStatus.PENDING
                        || existing.getStatus() == CommitmentInstanceStatus.OVERDUE);
            // Also retired: an untouched occurrence of a rule that has since been deleted.
            // Deleting "Netflix" means this cycle's unpaid Netflix is no longer owed -
            // left in place it kept counting against what's free. Archived rules are
            // different on purpose: archiving stops future cycles, it doesn't cancel a
            // bill already due in this one.
            boolean ruleGone = rule == null || rule.isDeleted();
            if (untouched && (ruleGone || !generator.occursIn(rule, cycle))) {
                existing.markDeleted();
                repository.save(existing);
                log.info("Commitment instance retired id={} commitmentId={} reason={}",
                        existing.getId(), existing.getCommitmentId(),
                        ruleGone ? "rule deleted" : "outside active window");
            } else if (untouched) {
                reconcileWithRule(existing, rule, cycle);
            }
        }

        List<CommitmentInstance> instances = repository.findByCycleIdAndUserId(cycle.getId(), userId);
        LocalDate today = LocalDate.now(clock);
        for (CommitmentInstance instance : instances) {
            if (instance.getStatus() == CommitmentInstanceStatus.PENDING && instance.getDueDate().isBefore(today)) {
                instance.setStatus(CommitmentInstanceStatus.OVERDUE);
                repository.save(instance);
            }
        }
        // One lookup for the whole list rather than four per settled row.
        Map<Long, LocalDate> transactionDates = transactionService.datesByIds(
                instances.stream()
                        .map(CommitmentInstance::getLinkedTransactionId)
                        .filter(Objects::nonNull)
                        .toList());
        return instances.stream().map(instance -> toView(instance, transactionDates)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommitmentInstance> recentForCommitment(Long commitmentId) {
        return repository.findTop6ByCommitmentIdAndUserIdOrderByDueDateDesc(commitmentId, currentUser.currentUserId());
    }

    @Override
    @Transactional
    public CommitmentPlanProgress planProgress(Long cycleId) {
        return planProgress(listForCycle(cycleId));
    }

    private CommitmentPlanProgress planProgress(List<CommitmentInstanceView> views) {
        int settledCount = 0, totalCount = 0, needsYouCount = 0, upcomingCount = 0;
        BigDecimal settledTotal = BigDecimal.ZERO, plannedTotal = BigDecimal.ZERO;
        BigDecimal needsYouTotal = BigDecimal.ZERO, upcomingTotal = BigDecimal.ZERO;
        int incomeCount = 0;
        BigDecimal incomeExpected = BigDecimal.ZERO, incomeReceived = BigDecimal.ZERO;
        LocalDate today = LocalDate.now(clock);
        // Keyed by category id (null = no category); sorted once the walk is done.
        Map<Long, CategoryTotals> byCategory = new HashMap<>();
        Map<LocalDate, GroupTotals> byDueDate = new java.util.TreeMap<>();

        for (CommitmentInstanceView view : views) {
            CommitmentInstance instance = view.instance();
            // Expected income isn't a bill: it's kept out of what's planned to leave, and
            // counted on its own - what arrived, and what is still to come.
            if (view.commitment().getSettleAs() == com.finance.transaction.domain.TransactionType.INCOME) {
                incomeCount++;
                if (instance.getStatus() == CommitmentInstanceStatus.SKIPPED) {
                    continue;
                }
                if (instance.getStatus().isClosed()) {
                    incomeReceived = incomeReceived.add(orZero(instance.getConfirmedAmount()));
                } else {
                    incomeExpected = incomeExpected.add(orZero(instance.outstanding()));
                }
                continue;
            }
            totalCount++;
            Category category = view.category();
            CategoryTotals group = byCategory.computeIfAbsent(category == null ? null : category.getId(),
                    id -> new CategoryTotals(category));
            group.count++;
            GroupTotals day = byDueDate.computeIfAbsent(instance.getDueDate(), d -> new GroupTotals());
            day.count++;

            BigDecimal knownAmount = instance.getStatus() == CommitmentInstanceStatus.SKIPPED ? null
                    : instance.getExpectedAmount() != null ? instance.getExpectedAmount() : instance.getConfirmedAmount();
            if (knownAmount != null) {
                plannedTotal = plannedTotal.add(knownAmount);
                group.planned = group.planned.add(knownAmount);
                day.planned = day.planned.add(knownAmount);
            }

            // Same classification the rows are mapped with, so a heading can't disagree
            // with the list beneath it.
            switch (AttentionTier.of(instance, view.commitment(), today)) {
                case SETTLED -> {
                    settledCount++;
                    BigDecimal paid = instance.getConfirmedAmount() != null ? instance.getConfirmedAmount() : BigDecimal.ZERO;
                    settledTotal = settledTotal.add(paid);
                }
                case NEEDS_YOU -> {
                    needsYouCount++;
                    needsYouTotal = needsYouTotal.add(orZero(instance.outstanding()));
                    group.outstanding = group.outstanding.add(orZero(instance.outstanding()));
                    day.outstanding = day.outstanding.add(orZero(instance.outstanding()));
                }
                case WORTH_KNOWING -> {
                    upcomingCount++;
                    upcomingTotal = upcomingTotal.add(orZero(instance.outstanding()));
                    group.outstanding = group.outstanding.add(orZero(instance.outstanding()));
                    day.outstanding = day.outstanding.add(orZero(instance.outstanding()));
                }
            }
        }

        // Categories in the user's own order (as the Ledger lists them), then by name;
        // bills without a category last, so the gap is visible rather than buried.
        List<CommitmentPlanProgress.CategoryGroupTotal> categoryTotals = byCategory.values().stream()
                .sorted(Comparator.comparing((CategoryTotals t) -> t.category == null)
                        .thenComparing(t -> t.category == null ? 0 : t.category.getDisplayOrder())
                        .thenComparing(t -> t.category == null ? "" : t.category.getName(), String.CASE_INSENSITIVE_ORDER))
                .map(t -> new CommitmentPlanProgress.CategoryGroupTotal(t.category, t.count, t.planned, t.outstanding))
                .toList();
        // Due dates in order - the "by when" view, one band per day money leaves.
        List<CommitmentPlanProgress.DueDateGroupTotal> dueDateTotals = byDueDate.entrySet().stream()
                .map(e -> new CommitmentPlanProgress.DueDateGroupTotal(
                        e.getKey(), e.getValue().count, e.getValue().planned, e.getValue().outstanding))
                .toList();
        return new CommitmentPlanProgress(settledCount, settledTotal, totalCount, plannedTotal,
                needsYouCount, needsYouTotal, upcomingCount, upcomingTotal, categoryTotals,
                incomeCount, incomeExpected, incomeReceived, dueDateTotals);
    }

    /** Running subtotal for one due date while the plan is walked once. */
    private static final class GroupTotals {
        private int count;
        private BigDecimal planned = BigDecimal.ZERO;
        private BigDecimal outstanding = BigDecimal.ZERO;
    }

    /** Running subtotal for one category while the plan is walked once. */
    private static final class CategoryTotals {
        private final Category category;
        private int count;
        private BigDecimal planned = BigDecimal.ZERO;
        private BigDecimal outstanding = BigDecimal.ZERO;

        private CategoryTotals(Category category) {
            this.category = category;
        }
    }

    /** An unknown amount contributes nothing to a subtotal - it does not make the total
     *  wrong, only incomplete, and the row itself already says the amount is missing. */
    private BigDecimal orZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    @Override
    @Transactional
    public CycleStanding standing(Long cycleId) {
        return standing(cycleService.getById(cycleId), planProgress(cycleId));
    }

    private CycleStanding standing(Cycle cycle, CommitmentPlanProgress progress) {
        // Expected until it arrives, then what arrived - never both: received salary is
        // counted through its occurrence, and only income no occurrence claims is added.
        BigDecimal other = repository.sumUnlinked(currentUser.currentUserId(), TransactionType.INCOME,
                cycle.getStartDate(), cycle.getEndDate());
        BigDecimal income = progress.incomeReceivedTotal().add(progress.incomeExpectedTotal()).add(other);
        BigDecimal committed = progress.plannedTotal();
        BigDecimal uncommitted = income.subtract(committed);
        BigDecimal share = income.signum() > 0 ? committed.divide(income, 4, RoundingMode.HALF_UP) : null;

        return new CycleStanding(income, progress.incomeExpectedTotal(), committed, uncommitted, share);
    }

    @Override
    @Transactional
    public CycleShape shape(Long cycleId) {
        Cycle cycle = cycleService.getById(cycleId);
        Long userId = currentUser.currentUserId();
        List<CommitmentInstanceView> views = listForCycle(cycleId);
        CommitmentPlanProgress progress = planProgress(views);
        CycleStanding standing = standing(cycle, progress);

        BigDecimal committed = BigDecimal.ZERO;
        BigDecimal savings = BigDecimal.ZERO;
        int unknown = 0;
        for (CommitmentInstanceView view : views) {
            CommitmentInstance instance = view.instance();
            Commitment commitment = view.commitment();
            TransactionType kind = commitment.getSettleAs();
            if (kind == TransactionType.INCOME || instance.getStatus() == CommitmentInstanceStatus.SKIPPED) {
                continue;
            }
            BigDecimal amount = instance.getExpectedAmount() != null ? instance.getExpectedAmount() : instance.getConfirmedAmount();
            if (amount == null) {
                unknown++;
                continue;
            }
            // Money moved or invested out of an account that isn't spending money (cash kept
            // for the emergency fund) was set aside already - it isn't taken from this month's income.
            if ((kind == TransactionType.INVESTMENT || kind == TransactionType.TRANSFER)
                    && !accountService.getByIdIncludingDeleted(commitment.getAccountId()).countsAsSpendable()) {
                continue;
            }
            if (kind == TransactionType.INVESTMENT) {
                savings = savings.add(amount);
            } else if (kind == TransactionType.TRANSFER) {
                Account to = accountService.getByIdIncludingDeleted(commitment.getToAccountId());
                if (to.getType() == AccountType.CREDIT_CARD || to.getType() == AccountType.LOAN) {
                    committed = committed.add(amount);   // paying a debt is spoken-for money
                } else if (!to.countsAsSpendable()) {
                    savings = savings.add(amount);       // set aside
                }
                // Between two spendable accounts: neither.
            } else {
                committed = committed.add(amount);
            }
        }

        BigDecimal income = standing.incomeTotal();
        boolean noIncome = income.signum() == 0 && progress.incomeCount() == 0;
        BigDecimal flexible = noIncome ? null : income.subtract(committed).subtract(savings);
        CycleShape.State state = noIncome ? CycleShape.State.NO_INCOME
                : unknown > 0 ? CycleShape.State.INCOMPLETE : CycleShape.State.COMPLETE;

        BigDecimal spent = repository.sumUnlinked(userId, TransactionType.EXPENSE, cycle.getStartDate(), cycle.getEndDate())
                .subtract(repository.sumUnlinked(userId, TransactionType.REFUND, cycle.getStartDate(), cycle.getEndDate()))
                .max(BigDecimal.ZERO);
        BigDecimal spentShare = flexible != null && flexible.signum() > 0
                ? spent.divide(flexible, 4, RoundingMode.HALF_UP) : null;

        return new CycleShape(state, income, standing.incomeExpectedTotal(), committed, savings, flexible, unknown,
                spent, spentShare, elapsed(cycle));
    }

    /** Share of the cycle's days gone, today included. */
    private BigDecimal elapsed(Cycle cycle) {
        LocalDate today = LocalDate.now(clock);
        if (today.isBefore(cycle.getStartDate())) {
            return BigDecimal.ZERO;
        }
        if (today.isAfter(cycle.getEndDate())) {
            return BigDecimal.ONE;
        }
        long total = java.time.temporal.ChronoUnit.DAYS.between(cycle.getStartDate(), cycle.getEndDate()) + 1;
        long gone = java.time.temporal.ChronoUnit.DAYS.between(cycle.getStartDate(), today) + 1;
        return BigDecimal.valueOf(gone).divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP);
    }

    @Override
    @Transactional(readOnly = true)
    public CommitmentInstanceView getById(Long id) {
        return toView(requireOwned(id));
    }

    @Override
    @Transactional(readOnly = true)
    public CommitmentInstanceDetailView getDetail(Long id) {
        CommitmentInstance instance = requireOwned(id);
        Commitment commitment = requireCommitment(instance.getCommitmentId());
        Account account = accountService.getByIdIncludingDeleted(commitment.getAccountId());
        Category category = commitment.getCategoryId() == null
                ? null : categoryService.getByIdIncludingDeleted(commitment.getCategoryId());
        TransactionView linkedTransaction = instance.getLinkedTransactionId() == null
                ? null : transactionService.getById(instance.getLinkedTransactionId());
        List<CommitmentInstance> history = repository.findTop6ByCommitmentIdAndUserIdOrderByDueDateDesc(
                commitment.getId(), currentUser.currentUserId());
        return new CommitmentInstanceDetailView(instance, commitment, account, category, linkedTransaction, history);
    }

    @Override
    @Transactional
    public CommitmentInstanceView settle(Long id, SettleCommitmentInstanceRequest request) {
        CommitmentInstance instance = requireOwned(id);
        if (instance.getStatus() == CommitmentInstanceStatus.PAID
                || instance.getStatus() == CommitmentInstanceStatus.SETTLED_EARLIER) {
            throw new BusinessRuleException(ErrorCode.INSTANCE_ALREADY_SETTLED,
                    "This is already settled.");
        }

        Commitment commitment = requireCommitment(instance.getCommitmentId());

        TransactionView transaction = transactionService.getById(request.transactionId());
        // One payment pays one bill. Linking an entry that already settles another
        // occurrence would count that money against two bills (rule 4) - and the Settle
        // sheet now offers existing Ledger entries to link, so this can actually be asked.
        if (repository.existsByLinkedTransactionIdAndIdNot(request.transactionId(), id)) {
            throw new BusinessRuleException(ErrorCode.TRANSACTION_ALREADY_LINKED,
                    "That entry already pays another bill. Pick a different one, or record a new payment.",
                    "transactionId");
        }
        if (transaction.transaction().getType() != commitment.getSettleAs()) {
            throw new BusinessRuleException(ErrorCode.SETTLE_TYPE_MISMATCH,
                    "This bill is paid as %s, and that entry is %s. Pick a matching entry, or record a new payment."
                            .formatted(article(commitment.getSettleAs()), article(transaction.transaction().getType())),
                    "transactionId");
        }
        // From the bill's account - and, for a transfer or investment, into the bill's destination.
        boolean accountMatches = transaction.transaction().getAccountId().equals(commitment.getAccountId())
                && (commitment.getToAccountId() == null
                    || commitment.getToAccountId().equals(transaction.transaction().getToAccountId()));

        CommitmentSettlementCalculator.Result result = calculator.settle(
                instance, commitment, accountMatches, request.amount());

        instance.setStatus(result.status());
        instance.setConfirmedAmount(result.confirmedAmountTotal());
        if (instance.getExpectedAmount() == null) {
            instance.setExpectedAmount(result.confirmedAmountTotal());
        }
        instance.setConfirmedAt(Instant.now());
        instance.setLinkedTransactionId(request.transactionId());

        CommitmentInstance saved = repository.save(instance);
        log.info("Commitment instance settled id={} status={}", saved.getId(), saved.getStatus());
        Map<Long, LocalDate> dates = saved.getLinkedTransactionId() == null
                ? Map.of() : transactionService.datesByIds(List.of(saved.getLinkedTransactionId()));
        return new CommitmentInstanceView(saved, commitment,
                accountService.getByIdIncludingDeleted(commitment.getAccountId()), settledOn(saved, dates),
                categoryOf(commitment));
    }

    @Override
    @Transactional
    public CommitmentInstanceView confirm(Long id) {
        CommitmentInstance instance = requireOwned(id);
        if (instance.getStatus() != CommitmentInstanceStatus.UNVERIFIED) {
            throw new BusinessRuleException(ErrorCode.VERIFICATION_REQUIRED,
                    "This instance isn't waiting on verification.");
        }
        instance.setStatus(CommitmentInstanceStatus.PAID);
        CommitmentInstance saved = repository.save(instance);
        log.info("Commitment instance confirmed id={}", saved.getId());
        return toView(saved);
    }

    private static String article(com.finance.transaction.domain.TransactionType type) {
        return switch (type) {
            case EXPENSE -> "an expense";
            case INCOME -> "income";
            case TRANSFER -> "a transfer";
            case INVESTMENT -> "an investment";
            case REFUND -> "a refund";
        };
    }

    @Override
    @Transactional
    public CommitmentInstanceView skip(Long id) {
        CommitmentInstance instance = requireOwned(id);
        Commitment commitment = requireCommitment(instance.getCommitmentId());
        if (commitment.isMandatory()) {
            throw new BusinessRuleException(ErrorCode.INSTANCE_NOT_SKIPPABLE,
                    "This is a must-pay bill, so it can't be skipped. Edit the bill if it's optional.");
        }
        // Only an occurrence nothing has happened to yet: part of it paid, or a payment
        // linked, means money has moved and "skipped" would hide it.
        boolean untouched = instance.getLinkedTransactionId() == null && instance.getConfirmedAmount() == null
                && (instance.getStatus() == CommitmentInstanceStatus.PENDING
                    || instance.getStatus() == CommitmentInstanceStatus.OVERDUE);
        if (!untouched) {
            throw new BusinessRuleException(ErrorCode.INSTANCE_NOT_SKIPPABLE,
                    "Something has already been paid or linked on this bill, so it can't be skipped.");
        }
        instance.setStatus(CommitmentInstanceStatus.SKIPPED);
        CommitmentInstance saved = repository.save(instance);
        log.info("Commitment instance skipped id={}", saved.getId());
        return toView(saved);
    }

    @Override
    @Transactional
    public CommitmentInstanceView unskip(Long id) {
        CommitmentInstance instance = requireOwned(id);
        if (instance.getStatus() != CommitmentInstanceStatus.SKIPPED) {
            throw new BusinessRuleException(ErrorCode.INSTANCE_NOT_SKIPPABLE, "This bill isn't skipped.");
        }
        instance.setStatus(instance.getDueDate().isBefore(LocalDate.now(clock))
                ? CommitmentInstanceStatus.OVERDUE : CommitmentInstanceStatus.PENDING);
        CommitmentInstance saved = repository.save(instance);
        log.info("Commitment instance unskipped id={}", saved.getId());
        return toView(saved);
    }

    /**
     * Gives an unpaid occurrence an expected amount - an estimate is fine.
     *
     * <p>Before this, the only way a VARIABLE mandatory bill (electricity, petrol) got an
     * amount was being settled - so every such bill held Real Balance and Room at
     * INCOMPLETE from the day its occurrence was generated until the day it was paid, i.e.
     * most of every cycle. ADR-0006 is right that an unknown amount must not be guessed;
     * it never said the user can't supply one. When the bill is later settled, the
     * confirmed amount is recorded alongside this, and the difference shows as variance.
     */
    @Override
    @Transactional
    public CommitmentInstanceView setExpectedAmount(Long id, BigDecimal expectedAmount) {
        CommitmentInstance instance = requireOwned(id);
        if (instance.getStatus() == CommitmentInstanceStatus.PAID
                || instance.getStatus() == CommitmentInstanceStatus.SETTLED_EARLIER) {
            throw new BusinessRuleException(ErrorCode.INSTANCE_ALREADY_SETTLED,
                    "This is already settled, so its amount is what was actually paid.");
        }
        instance.setExpectedAmount(expectedAmount);
        CommitmentInstance saved = repository.save(instance);
        // Never the amount itself - ADR-0010.
        log.info("Commitment instance expected amount set id={}", saved.getId());
        return toView(saved);
    }

    /**
     * Carries an edited rule into an occurrence nothing has acted on yet. Occurrences copy
     * their due date and amount when generated, so without this, changing "Rent ₹15,000 on
     * the 5th" to "₹16,000 on the 7th" changed the rule and left this month and every month
     * already opened (October, planned ahead) showing the old figures.
     *
     * <p>Only untouched occurrences - no payment linked, nothing confirmed. A paid month is
     * history and keeps what was recorded. A variable bill's amount is left alone: it is
     * whatever the user estimated for that month, not something the rule knows.
     */
    private void reconcileWithRule(CommitmentInstance occurrence, Commitment rule, Cycle cycle) {
        boolean changed = false;

        LocalDate due = generator.dueDateWithin(rule, cycle);
        if (!due.equals(occurrence.getDueDate())) {
            occurrence.setDueDate(due);
            // Moved to a day that hasn't come yet - no longer overdue.
            if (occurrence.getStatus() == CommitmentInstanceStatus.OVERDUE && !due.isBefore(LocalDate.now(clock))) {
                occurrence.setStatus(CommitmentInstanceStatus.PENDING);
            }
            changed = true;
        }

        if (rule.getAmountType() == com.finance.commitment.domain.CommitmentAmountType.FIXED
                && !com.finance.common.money.MoneyScale.equal(rule.getFixedAmount(), occurrence.getExpectedAmount())) {
            occurrence.setExpectedAmount(rule.getFixedAmount());
            changed = true;
        }

        if (changed) {
            repository.save(occurrence);
            log.info("Commitment instance updated from its rule id={} commitmentId={}", occurrence.getId(), rule.getId());
        }
    }

    private CommitmentInstanceView toView(CommitmentInstance instance) {
        Long linked = instance.getLinkedTransactionId();
        Map<Long, LocalDate> dates = linked == null ? Map.of() : transactionService.datesByIds(List.of(linked));
        return toView(instance, dates);
    }

    private CommitmentInstanceView toView(CommitmentInstance instance, Map<Long, LocalDate> transactionDates) {
        Commitment commitment = requireCommitment(instance.getCommitmentId());
        return new CommitmentInstanceView(instance, commitment,
                accountService.getByIdIncludingDeleted(commitment.getAccountId()),
                settledOn(instance, transactionDates), categoryOf(commitment));
    }

    private Category categoryOf(Commitment commitment) {
        return commitment.getCategoryId() == null
                ? null : categoryService.getByIdIncludingDeleted(commitment.getCategoryId());
    }

    /**
     * When the money moved. The linked transaction's date is the truth; {@code confirmedAt}
     * is only when we were told, which can be days later for a back-dated entry. Falls
     * back to it when nothing is linked, and stays null while the instance is unsettled -
     * an unpaid item has no payment date, and a due date is not a substitute for one.
     */
    private LocalDate settledOn(CommitmentInstance instance, Map<Long, LocalDate> transactionDates) {
        // Guarded, not left to Map#get: `datesByIds` returns an immutable Map.of() when no
        // instance in the list is linked, and immutable maps throw on a null key rather
        // than returning null. Every unpaid instance has a null link, so without this one
        // unsettled bill made GET /cycles/{id}/commitment-instances (and plan-progress,
        // which calls it) a 500 - Today's and Month's Needs You could never show anything.
        Long linked = instance.getLinkedTransactionId();
        LocalDate fromTransaction = linked == null ? null : transactionDates.get(linked);
        if (fromTransaction != null) {
            return fromTransaction;
        }
        return instance.getConfirmedAt() == null
                ? null : LocalDate.ofInstant(instance.getConfirmedAt(), clock.getZone());
    }

    private Commitment requireCommitment(Long commitmentId) {
        return commitmentRepository.findById(commitmentId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.COMMITMENT_NOT_FOUND,
                        "The commitment behind this instance no longer exists."));
    }

    private CommitmentInstance requireOwned(Long id) {
        return repository.findByIdAndUserId(id, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.COMMITMENT_INSTANCE_NOT_FOUND,
                        "We couldn't find that commitment instance."));
    }
}
