package com.finance.cycle;

import com.finance.category.CategoryService;
import com.finance.category.domain.Category;
import com.finance.category.domain.CategoryGroup;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.domain.Cycle;
import com.finance.cycle.domain.CycleSnapshot;
import com.finance.position.NetWorthResult;
import com.finance.position.PositionResult;
import com.finance.position.PositionService;
import com.finance.transaction.CategorySpendProjection;
import com.finance.transaction.TransactionRepository;
import com.finance.transaction.domain.TransactionType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class CycleServiceImpl implements CycleService {

    private static final Logger log = LoggerFactory.getLogger(CycleServiceImpl.class);

    private final CycleRepository repository;
    private final CycleSnapshotRepository snapshotRepository;
    private final CurrentCycleResolver cycleResolver;
    private final TransactionRepository transactionRepository;
    private final PositionService positionService;
    private final CategoryService categoryService;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public CycleServiceImpl(CycleRepository repository,
                            CycleSnapshotRepository snapshotRepository,
                            CurrentCycleResolver cycleResolver,
                            TransactionRepository transactionRepository,
                            PositionService positionService,
                            CategoryService categoryService,
                            CurrentUserProvider currentUser,
                            Clock clock) {
        this.repository = repository;
        this.snapshotRepository = snapshotRepository;
        this.cycleResolver = cycleResolver;
        this.transactionRepository = transactionRepository;
        this.positionService = positionService;
        this.categoryService = categoryService;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Override
    @Transactional
    public Cycle resolveCurrent() {
        return resolveForDate(LocalDate.now(clock));
    }

    @Override
    @Transactional
    public Cycle resolveForDate(LocalDate date) {
        return cycleResolver.resolve(currentUser.currentUserId(), date);
    }

    @Override
    @Transactional(readOnly = true)
    public Cycle getById(Long id) {
        return repository.findByIdAndUserId(id, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CYCLE_NOT_FOUND,
                        "We couldn't find that cycle."));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Cycle> list(Pageable pageable) {
        return repository.findByUserIdOrderByStartDateDesc(currentUser.currentUserId(), pageable);
    }

    @Override
    @Transactional
    public CycleSnapshot close(Long id) {
        Long userId = currentUser.currentUserId();
        Cycle cycle = getById(id);

        if (cycle.isClosed()) {
            throw new BusinessRuleException(ErrorCode.CYCLE_ALREADY_CLOSED,
                    "This cycle is already closed.");
        }
        if (!cycle.getEndDate().isBefore(LocalDate.now(clock))) {
            throw new BusinessRuleException(ErrorCode.CYCLE_NOT_YET_ENDED,
                    "This cycle hasn't ended yet - it closes after " + cycle.getEndDate() + ".");
        }

        CycleSummary summary = computeSummary(userId, cycle);

        PositionResult position = positionService.currentPosition();
        NetWorthResult netWorth = positionService.currentNetWorth();

        CycleSnapshot snapshot = CycleSnapshot.builder()
                .userId(userId)
                .cycleId(cycle.getId())
                .incomeTotal(summary.incomeTotal())
                .expenseTotal(summary.expenseTotal())
                .investedTotal(summary.investedTotal())
                .transferredTotal(summary.transferredTotal())
                .net(summary.net())
                .savingsRate(summary.savingsRate())
                .realBalance(position.complete() ? MoneyScale.normalise(position.realBalance()) : null)
                .netWorth(MoneyScale.normalise(netWorth.netWorth()))
                .totalDebt(MoneyScale.normalise(netWorth.totalDebt()))
                .createdAt(Instant.now())
                .build();

        CycleSnapshot saved = snapshotRepository.save(snapshot);
        cycle.setClosedAt(Instant.now());
        repository.save(cycle);

        log.info("Cycle closed id={} snapshotId={}", cycle.getId(), saved.getId());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public CycleSnapshot getSnapshot(Long cycleId) {
        return snapshotRepository.findByCycleIdAndUserId(cycleId, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CYCLE_NOT_FOUND,
                        "This cycle has no snapshot - it may not be closed yet."));
    }

    @Override
    @Transactional(readOnly = true)
    public CycleSummary previewSummary(Long cycleId) {
        Cycle cycle = getById(cycleId);
        return computeSummary(currentUser.currentUserId(), cycle);
    }

    @Override
    @Transactional(readOnly = true)
    public FlexibleSpending flexibleSpending(Long cycleId) {
        Cycle cycle = getById(cycleId);
        Long userId = currentUser.currentUserId();
        List<CategorySpendProjection> rows = transactionRepository.sumByCategoryInRange(
                userId, TransactionType.EXPENSE, cycle.getStartDate(), cycle.getEndDate());

        record Line(Category category, BigDecimal amount) {
        }

        // Spend recorded on a sub-category counts toward its parent, not beside it (V12).
        // Without this, adding "Fuel", "Cab" and "Metro" under "Transport" would turn one
        // comparable line into four fragments, and the question this section answers -
        // "is transport up on last cycle?" - would stop having a single answer.
        // Grouping, not arithmetic on money: the amounts are the server's own sums,
        // added here with BigDecimal.
        java.util.Map<Long, BigDecimal> byTopLevel = new java.util.LinkedHashMap<>();
        java.util.Map<Long, Category> topLevels = new java.util.HashMap<>();
        for (CategorySpendProjection row : rows) {
            Category category = categoryService.getByIdIncludingDeleted(row.getCategoryId());
            if (category.getGroup() != CategoryGroup.FLEXIBLE) {
                continue;
            }
            Category attributeTo = category.isSubCategory()
                    ? categoryService.getByIdIncludingDeleted(category.getParentId())
                    : category;
            topLevels.putIfAbsent(attributeTo.getId(), attributeTo);
            byTopLevel.merge(attributeTo.getId(), MoneyScale.normalise(row.getTotal()), BigDecimal::add);
        }

        List<Line> flexible = byTopLevel.entrySet().stream()
                .map(e -> new Line(topLevels.get(e.getKey()), MoneyScale.normalise(e.getValue())))
                .sorted(Comparator.comparing(Line::amount).reversed())
                .toList();

        BigDecimal total = flexible.stream()
                .map(Line::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<CategorySpend> categories = flexible.stream()
                .map(line -> new CategorySpend(line.category().getId(), line.category().getName(),
                        line.category().getGroup().name(), line.amount(), shareOf(line.amount(), total)))
                .toList();

        return new FlexibleSpending(MoneyScale.normalise(total), categories);
    }

    /** A share of nothing is undefined, not zero - see ADR-0006. */
    private BigDecimal shareOf(BigDecimal amount, BigDecimal total) {
        return total.signum() > 0 ? amount.divide(total, 4, RoundingMode.HALF_UP) : null;
    }

    private CycleSummary computeSummary(Long userId, Cycle cycle) {
        BigDecimal income = transactionRepository.sumAmountByTypeInRange(
                userId, TransactionType.INCOME, cycle.getStartDate(), cycle.getEndDate());
        BigDecimal expenseGross = transactionRepository.sumAmountByTypeInRange(
                userId, TransactionType.EXPENSE, cycle.getStartDate(), cycle.getEndDate());
        BigDecimal refunds = transactionRepository.sumAmountByTypeInRange(
                userId, TransactionType.REFUND, cycle.getStartDate(), cycle.getEndDate());
        BigDecimal invested = transactionRepository.sumAmountByTypeInRange(
                userId, TransactionType.INVESTMENT, cycle.getStartDate(), cycle.getEndDate());
        BigDecimal transferred = transactionRepository.sumAmountByTypeInRange(
                userId, TransactionType.TRANSFER, cycle.getStartDate(), cycle.getEndDate());

        BigDecimal expense = expenseGross.subtract(refunds);
        BigDecimal net = income.subtract(expense);
        BigDecimal savingsRate = income.signum() > 0
                ? net.divide(income, 4, RoundingMode.HALF_UP)
                : null;

        return new CycleSummary(MoneyScale.normalise(income), MoneyScale.normalise(expense),
                MoneyScale.normalise(invested), MoneyScale.normalise(transferred), MoneyScale.normalise(net), savingsRate);
    }
}
