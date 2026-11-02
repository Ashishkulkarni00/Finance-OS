package com.finance.review;

import com.finance.category.CategoryService;
import com.finance.category.domain.Category;
import com.finance.commitment.CommitmentInstanceRepository;
import com.finance.commitment.CommitmentRepository;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.CycleRepository;
import com.finance.cycle.PlanAdherence;
import com.finance.cycle.domain.Cycle;
import com.finance.loan.AmortisationCalculator;
import com.finance.loan.AmortisationEntry;
import com.finance.loan.LoanService;
import com.finance.loan.LoanView;
import com.finance.loan.domain.LoanStatus;
import com.finance.transaction.CategorySpendProjection;
import com.finance.transaction.TransactionRepository;
import com.finance.transaction.domain.TransactionType;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Consolidates salary months and walks debt forward, for Summary.
 *
 * <p><strong>Nothing here is a second engine.</strong> Each month's figures come from the
 * same repository sums {@code CycleServiceImpl.computeSummary} uses, the committed/flexible
 * split from the same {@code sumUnplannedByTypeInRange} that Room is built on, the
 * commitment counts from the same {@link PlanAdherence} the snapshot is written with, and
 * the debt curve from the same {@code AmortisationCalculator} the Debts register reads. A
 * figure that disagreed with the screen it came from would make the whole page worthless.
 *
 * <p><strong>No cycle is created by reading this.</strong> {@code CurrentCycleResolver}
 * finds-or-creates, which is right for a month the user is working in and wrong for a
 * report: a glance at Summary must not leave rows behind. Only cycles that already exist
 * and have started are consolidated, which is also the honest definition of "months we
 * know about".
 *
 * <p>Safe to inject from anywhere: this is a leaf. It deliberately does not touch
 * {@code CycleService} or {@code PositionService} - the two beans the bean-cycle traps in
 * {@code CLAUDE.md} are about - and nothing injects it back.
 */
@Service
public class ReviewServiceImpl implements ReviewService {

    /** Past two years the comparison stops being a comparison and becomes a wall. */
    private static final int MAX_MONTHS = 24;

    /** A guard on the walk, not a product limit - the longest real tenure here is 48 EMIs. */
    private static final int MAX_POINTS = 480;

    private static final int RATE_SCALE = 4;

    private final CycleRepository cycleRepository;
    private final TransactionRepository transactionRepository;
    private final CommitmentInstanceRepository instanceRepository;
    /** Read for one thing only: whether a bill settles as income - see {@link #billsOnly}. */
    private final CommitmentRepository commitmentRepository;
    /** Resolves a sub-category to its parent, so a breakdown has one row per real heading. */
    private final CategoryService categoryService;
    private final LoanService loanService;
    private final AmortisationCalculator amortisation;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public ReviewServiceImpl(CycleRepository cycleRepository,
                             TransactionRepository transactionRepository,
                             CommitmentInstanceRepository instanceRepository,
                             CommitmentRepository commitmentRepository,
                             CategoryService categoryService,
                             LoanService loanService,
                             AmortisationCalculator amortisation,
                             CurrentUserProvider currentUser,
                             Clock clock) {
        this.cycleRepository = cycleRepository;
        this.transactionRepository = transactionRepository;
        this.instanceRepository = instanceRepository;
        this.commitmentRepository = commitmentRepository;
        this.categoryService = categoryService;
        this.loanService = loanService;
        this.amortisation = amortisation;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    // -----------------------------------------------------------------------------
    // Month by month
    // -----------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public ReviewResult months(int months) {
        int horizon = Math.max(1, Math.min(months, MAX_MONTHS));
        Long userId = currentUser.currentUserId();
        LocalDate today = LocalDate.now(clock);

        Pageable window = PageRequest.of(0, horizon);
        List<Cycle> newestFirst = cycleRepository
                .findByUserIdAndStartDateLessThanEqualOrderByStartDateDesc(userId, today, window)
                .getContent();

        // Oldest first, so a chart reads left to right without the browser reversing a list
        // the server already ordered.
        List<Cycle> cycles = new ArrayList<>(newestFirst);
        cycles.sort(Comparator.comparing(Cycle::getStartDate));

        List<MonthReview> reviews = cycles.stream()
                .map(cycle -> review(userId, cycle, today))
                .toList();

        int recorded = (int) reviews.stream().filter(MonthReview::recorded).count();
        return new ReviewResult(today, reviews, recorded, samePoint(userId, cycles, today));
    }

    private MonthReview review(Long userId, Cycle cycle, LocalDate today) {
        LocalDate from = cycle.getStartDate();
        LocalDate to = cycle.getEndDate();

        BigDecimal income = sum(userId, TransactionType.INCOME, from, to);
        BigDecimal expenseGross = sum(userId, TransactionType.EXPENSE, from, to);
        BigDecimal refunds = sum(userId, TransactionType.REFUND, from, to);
        BigDecimal invested = sum(userId, TransactionType.INVESTMENT, from, to);
        BigDecimal transferred = sum(userId, TransactionType.TRANSFER, from, to);

        // A bill falling due is a plan fact - it does not depend on anything having been
        // recorded, so these are read whether the month has transactions in it or not.
        List<CommitmentInstance> bills = billsOnly(userId,
                instanceRepository.findByCycleIdAndUserId(cycle.getId(), userId));
        PlanAdherence adherence = PlanAdherence.from(bills);
        boolean planTracked = !bills.isEmpty();

        boolean current = !from.isAfter(today) && !to.isBefore(today);
        boolean recorded = income.signum() > 0 || expenseGross.signum() > 0
                || invested.signum() > 0 || transferred.signum() > 0;

        if (!recorded) {
            // Null, not zero, across every money field. See MonthReview's note: a flat line
            // through four charts, labelled as fact, is the worst thing this screen can do.
            return new MonthReview(cycle.getId(), from, to, cycle.label(), current, cycle.isClosed(),
                    false, planTracked, current ? elapsedShare(from, to, today) : null,
                    null, null, null, null, null, null, null, null, null,
                    adherence.planned(), adherence.kept(), adherence.plannedTotal(), adherence.actualTotal());
        }

        BigDecimal spend = expenseGross.subtract(refunds);
        BigDecimal committed = null;
        BigDecimal flexible = null;

        if (planTracked) {
            // Committed by the link, not by category: exactly the transactions already inside
            // the cycle's own committed figure, which is what this same query excludes for Room.
            BigDecimal unplannedExpense = transactionRepository.sumUnplannedByTypeInRange(
                    userId, TransactionType.EXPENSE, from, to);
            BigDecimal unplannedRefunds = transactionRepository.sumUnplannedByTypeInRange(
                    userId, TransactionType.REFUND, from, to);
            flexible = unplannedExpense.subtract(unplannedRefunds);
            committed = spend.subtract(flexible);
        }
        // Otherwise both stay null. Nothing in the month was linked to a bill because there
        // were no bills, so "0% committed" would be a statement about the plan's absence
        // dressed up as a statement about the person - see MonthReview's note on planTracked.

        BigDecimal net = income.subtract(spend);
        BigDecimal leftOver = net.subtract(invested);

        return new MonthReview(
                cycle.getId(), from, to, cycle.label(), current, cycle.isClosed(), true, planTracked,
                current ? elapsedShare(from, to, today) : null,
                MoneyScale.normalise(income),
                MoneyScale.normalise(spend),
                MoneyScale.normalise(committed),
                MoneyScale.normalise(flexible),
                MoneyScale.normalise(invested),
                MoneyScale.normalise(net),
                MoneyScale.normalise(leftOver),
                ratio(net, income),
                committed == null ? null : ratio(committed, income),
                adherence.planned(), adherence.kept(),
                adherence.plannedTotal(), adherence.actualTotal());
    }

    /**
     * The occurrences that are actually bills - everything except an income commitment's.
     *
     * <p>A salary credit is not a promise the user keeps, so counting it among "commitments
     * kept" inflates the North Star with the one thing that was never in doubt. On the real
     * October cycle it turned 16 of 17 into a figure that included the salary and the Diwali
     * bonus, and put their ₹57,700 inside a total labelled as what the plan would cost.
     *
     * <p>Filtered on {@code settleAs} alone, which needs no account lookup - so this
     * deliberately does not go anywhere near {@code CommitmentBucketClassifier}, whose
     * spendability branch is blocked behind an open decision (FIX_BACKLOG 1.11) and would
     * drag this screen into it.
     *
     * <p>{@code PlanAdherence} itself is left unfiltered: it is also what writes
     * {@code plannedCommittedTotal} and {@code commitmentsKept} into a snapshot at close, and
     * changing what gets stored in a historical row is a separate decision, not a side effect
     * of building a report. Logged in FIX_BACKLOG instead.
     */
    private List<CommitmentInstance> billsOnly(Long userId, List<CommitmentInstance> instances) {
        if (instances.isEmpty()) {
            return instances;
        }
        Set<Long> incomeCommitments = commitmentRepository
                .findByIdInAndUserId(instances.stream().map(CommitmentInstance::getCommitmentId).toList(), userId)
                .stream()
                .filter(commitment -> commitment.getSettleAs() == TransactionType.INCOME)
                .map(Commitment::getId)
                .collect(Collectors.toSet());

        return instances.stream()
                .filter(instance -> !incomeCommitments.contains(instance.getCommitmentId()))
                .toList();
    }

    /**
     * This month against the previous one cut off at the same day in - see
     * {@link SamePointComparison} for why the uncut comparison is not offered at all.
     */
    private SamePointComparison samePoint(Long userId, List<Cycle> cycles, LocalDate today) {
        if (cycles.size() < 2) {
            return null;
        }
        Cycle current = cycles.get(cycles.size() - 1);
        if (current.getStartDate().isAfter(today) || current.getEndDate().isBefore(today)) {
            return null;
        }
        Cycle previous = cycles.get(cycles.size() - 2);

        int daysIn = (int) ChronoUnit.DAYS.between(current.getStartDate(), today) + 1;
        // Clamped: a longer previous month must not be read past where this one has reached,
        // and a shorter one must not be read past its own end.
        LocalDate cutOff = previous.getStartDate().plusDays(daysIn - 1L);
        if (cutOff.isAfter(previous.getEndDate())) {
            cutOff = previous.getEndDate();
        }

        BigDecimal previousIncome = sum(userId, TransactionType.INCOME, previous.getStartDate(), cutOff);
        BigDecimal previousExpense = sum(userId, TransactionType.EXPENSE, previous.getStartDate(), cutOff);
        BigDecimal previousRefunds = sum(userId, TransactionType.REFUND, previous.getStartDate(), cutOff);
        if (previousIncome.signum() == 0 && previousExpense.signum() == 0) {
            return null;
        }
        BigDecimal previousSpend = previousExpense.subtract(previousRefunds);

        BigDecimal income = sum(userId, TransactionType.INCOME, current.getStartDate(), current.getEndDate());
        BigDecimal expense = sum(userId, TransactionType.EXPENSE, current.getStartDate(), current.getEndDate());
        BigDecimal refunds = sum(userId, TransactionType.REFUND, current.getStartDate(), current.getEndDate());
        BigDecimal spend = expense.subtract(refunds);

        return new SamePointComparison(
                previous.getId(), previous.label(), daysIn, cutOff,
                MoneyScale.normalise(previousSpend),
                MoneyScale.normalise(spend.subtract(previousSpend)),
                MoneyScale.normalise(previousIncome),
                MoneyScale.normalise(income.subtract(previousIncome)));
    }

    private BigDecimal sum(Long userId, TransactionType type, LocalDate from, LocalDate to) {
        return transactionRepository.sumAmountByTypeInRange(userId, type, from, to);
    }

    /** A share of nothing is undefined, not zero - ADR-0006, as everywhere else. */
    private BigDecimal ratio(BigDecimal part, BigDecimal whole) {
        return whole.signum() > 0 ? part.divide(whole, RATE_SCALE, RoundingMode.HALF_UP) : null;
    }

    private BigDecimal elapsedShare(LocalDate from, LocalDate to, LocalDate today) {
        long total = ChronoUnit.DAYS.between(from, to) + 1;
        long elapsed = ChronoUnit.DAYS.between(from, today) + 1;
        return BigDecimal.valueOf(elapsed).divide(BigDecimal.valueOf(total), RATE_SCALE, RoundingMode.HALF_UP);
    }

    // -----------------------------------------------------------------------------
    // What one month went on
    // -----------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public MonthCategories categories(Long cycleId) {
        Long userId = currentUser.currentUserId();
        Cycle cycle = cycleRepository.findByIdAndUserId(cycleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CYCLE_NOT_FOUND,
                        "We couldn't find that month."));

        LocalDate from = cycle.getStartDate();
        LocalDate to = cycle.getEndDate();

        // Four sums, then arithmetic on them - rather than one clever query. Expenses net of
        // refunds, and within that the part no commitment covers, per category.
        Map<Long, BigDecimal> expense = byCategory(userId, TransactionType.EXPENSE, from, to, false);
        Map<Long, BigDecimal> refund = byCategory(userId, TransactionType.REFUND, from, to, false);
        Map<Long, BigDecimal> expenseUnplanned = byCategory(userId, TransactionType.EXPENSE, from, to, true);
        Map<Long, BigDecimal> refundUnplanned = byCategory(userId, TransactionType.REFUND, from, to, true);

        boolean planTracked = !billsOnly(userId,
                instanceRepository.findByCycleIdAndUserId(cycle.getId(), userId)).isEmpty();

        record Totals(Category category, BigDecimal total, BigDecimal flexible) {
        }

        // Sub-categories attribute to their parent, as on Months: "Fuel", "Cab" and "Metro"
        // as three rows cannot answer "is transport up on last month" (V12).
        Map<Long, BigDecimal> totalByParent = new LinkedHashMap<>();
        Map<Long, BigDecimal> flexibleByParent = new LinkedHashMap<>();
        Map<Long, Category> parents = new HashMap<>();

        for (Long categoryId : expense.keySet()) {
            Category category = categoryService.getByIdIncludingDeleted(categoryId);
            Category attributeTo = category.isSubCategory()
                    ? categoryService.getByIdIncludingDeleted(category.getParentId())
                    : category;
            parents.putIfAbsent(attributeTo.getId(), attributeTo);

            BigDecimal total = expense.get(categoryId).subtract(zeroIfAbsent(refund, categoryId));
            BigDecimal flexible = zeroIfAbsent(expenseUnplanned, categoryId)
                    .subtract(zeroIfAbsent(refundUnplanned, categoryId));

            totalByParent.merge(attributeTo.getId(), MoneyScale.normalise(total), BigDecimal::add);
            flexibleByParent.merge(attributeTo.getId(), MoneyScale.normalise(flexible), BigDecimal::add);
        }

        List<Totals> ranked = totalByParent.entrySet().stream()
                .map(entry -> new Totals(parents.get(entry.getKey()),
                        MoneyScale.normalise(entry.getValue()),
                        MoneyScale.normalise(flexibleByParent.getOrDefault(entry.getKey(), MoneyScale.ZERO))))
                .sorted(Comparator.comparing(Totals::total).reversed())
                .toList();

        BigDecimal spend = ranked.stream().map(Totals::total).reduce(MoneyScale.ZERO, BigDecimal::add);
        BigDecimal flexible = ranked.stream().map(Totals::flexible).reduce(MoneyScale.ZERO, BigDecimal::add);
        BigDecimal committed = spend.subtract(flexible);

        List<MonthCategories.Line> lines = ranked.stream()
                .map(row -> new MonthCategories.Line(
                        row.category().getId(),
                        row.category().getName(),
                        row.category().getGroup().name(),
                        row.total(),
                        // Withheld, not zeroed, when there was no plan to be committed to.
                        planTracked ? MoneyScale.normalise(row.total().subtract(row.flexible())) : null,
                        planTracked ? row.flexible() : row.total(),
                        ratio(row.total(), spend),
                        planTracked ? ratio(row.flexible(), flexible) : ratio(row.total(), spend)))
                .toList();

        return new MonthCategories(cycle.getId(), cycle.label(), from, to,
                !ranked.isEmpty(), planTracked,
                MoneyScale.normalise(spend),
                planTracked ? MoneyScale.normalise(committed) : null,
                planTracked ? MoneyScale.normalise(flexible) : MoneyScale.normalise(spend),
                lines);
    }

    private Map<Long, BigDecimal> byCategory(Long userId, TransactionType type,
                                             LocalDate from, LocalDate to, boolean unplannedOnly) {
        List<CategorySpendProjection> rows = unplannedOnly
                ? transactionRepository.sumUnplannedByCategoryInRange(userId, type, from, to)
                : transactionRepository.sumByCategoryInRange(userId, type, from, to);
        Map<Long, BigDecimal> totals = new LinkedHashMap<>();
        for (CategorySpendProjection row : rows) {
            totals.put(row.getCategoryId(), MoneyScale.normalise(row.getTotal()));
        }
        return totals;
    }

    private BigDecimal zeroIfAbsent(Map<Long, BigDecimal> totals, Long categoryId) {
        return totals.getOrDefault(categoryId, MoneyScale.ZERO);
    }

    // -----------------------------------------------------------------------------
    // Debt, walked forward
    // -----------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public DebtTrajectory debtTrajectory() {
        LocalDate today = LocalDate.now(clock);
        List<LoanView> loans = loanService.list(Pageable.unpaged()).getContent().stream()
                .filter(v -> v.loan().getStatus() != LoanStatus.CLOSED)
                .toList();

        YearMonth start = YearMonth.from(today);
        // Each loan's remaining schedule, keyed by loan. A loan with no rate returns an
        // empty schedule rather than a guessed one, so it drops out of the curve here and
        // is reported separately below.
        Map<Long, List<AmortisationEntry>> schedules = new LinkedHashMap<>();
        Map<Long, BigDecimal> outstandingByLoan = new LinkedHashMap<>();
        BigDecimal outstandingNow = MoneyScale.ZERO;
        BigDecimal excludedOutstanding = MoneyScale.ZERO;
        BigDecimal interestAhead = MoneyScale.ZERO;
        int excluded = 0;
        int unrecordedEmis = 0;
        YearMonth last = start;

        List<DebtTrajectory.Loan> rows = new ArrayList<>();

        for (LoanView view : loans) {
            List<AmortisationEntry> schedule = amortisation.schedule(view.loan());
            List<AmortisationEntry> ahead = schedule.stream()
                    .filter(entry -> !entry.dueDate().isBefore(today))
                    .toList();
            boolean inCurve = !ahead.isEmpty() && view.outstandingPrincipal() != null;

            rows.add(new DebtTrajectory.Loan(view.loan().getId(), view.account().getName(),
                    MoneyScale.normalise(inCurve ? view.outstandingPrincipal() : view.loan().getOutstandingBalance()),
                    MoneyScale.normalise(view.loan().getEmi()),
                    inCurve ? view.payoffDate() : null, inCurve));

            if (!inCurve) {
                excluded++;
                excludedOutstanding = excludedOutstanding.add(
                        MoneyScale.normalise(view.loan().getOutstandingBalance()));
                continue;
            }

            schedules.put(view.loan().getId(), ahead);
            outstandingByLoan.put(view.loan().getId(), MoneyScale.normalise(view.outstandingPrincipal()));
            outstandingNow = outstandingNow.add(MoneyScale.normalise(view.outstandingPrincipal()));
            unrecordedEmis += view.unrecordedEmis();
            for (AmortisationEntry entry : ahead) {
                interestAhead = interestAhead.add(MoneyScale.normalise(entry.interestComponent()));
                YearMonth due = YearMonth.from(entry.dueDate());
                if (due.isAfter(last)) {
                    last = due;
                }
            }
        }

        Walked walked = walk(schedules, outstandingByLoan, start, last);
        List<DebtTrajectory.Point> points = walked.points();

        // Soonest payoff first, so the bands peel off the top of the stack as each loan
        // clears - which is the part of this chart a person can actually act on.
        Map<Long, String> namesByLoan = rows.stream()
                .filter(DebtTrajectory.Loan::inCurve)
                .collect(Collectors.toMap(DebtTrajectory.Loan::loanId, DebtTrajectory.Loan::name));
        Map<Long, LocalDate> payoffByLoan = rows.stream()
                .filter(row -> row.inCurve() && row.payoffDate() != null)
                .collect(Collectors.toMap(DebtTrajectory.Loan::loanId, DebtTrajectory.Loan::payoffDate));

        List<DebtTrajectory.Series> series = walked.balances().entrySet().stream()
                .sorted(Comparator.comparing(entry -> payoffByLoan.getOrDefault(entry.getKey(), LocalDate.MAX)))
                .map(entry -> new DebtTrajectory.Series(entry.getKey(),
                        namesByLoan.getOrDefault(entry.getKey(), "Loan"), entry.getValue()))
                .toList();

        // A debt-free date that omits a loan is worse than none at all - DebtPosition says
        // so in as many words, and the same rule has to hold for the curve's own end.
        LocalDate debtFree = excluded == 0 && !points.isEmpty() ? lastPayoff(rows) : null;
        Integer monthsToDebtFree = debtFree == null ? null : points.size() - 1;

        return new DebtTrajectory(today,
                MoneyScale.normalise(outstandingNow),
                debtFree, monthsToDebtFree,
                MoneyScale.normalise(interestAhead),
                unrecordedEmis,
                points, series, rows, excluded,
                MoneyScale.normalise(excludedOutstanding));
    }

    /** The last loan to clear. Null-safe over rows, though a row out of the curve has
     *  already forced the caller to discard this. */
    private LocalDate lastPayoff(List<DebtTrajectory.Loan> rows) {
        return rows.stream()
                .map(DebtTrajectory.Loan::payoffDate)
                .filter(date -> date != null)
                .max(Comparator.naturalOrder())
                .orElse(null);
    }

    /**
     * One point per calendar month: what is owed at the end of it, across every loan in the
     * curve.
     *
     * <p>A loan's contribution to month M is the closing balance of its last EMI due in M or
     * earlier; before its first remaining EMI it still owes what that EMI opens with, and
     * once its schedule runs out it owes nothing. The first point is today's outstanding
     * rather than the schedule's, so the line starts where the Debts register says it is.
     */
    /**
     * The curve, and each loan's own band within it, in one pass.
     *
     * <p>One point per calendar month: what is owed at the end of it, across every loan in
     * the curve, plus each loan's share of that figure so the bands can be stacked and still
     * add to the line.
     *
     * <p>A loan's contribution to month M is the closing balance of its last EMI due in M or
     * earlier; before its first remaining EMI it still owes what that EMI opens with, and
     * once its schedule runs out it owes nothing. The first point is each loan's outstanding
     * <em>today</em> rather than the schedule's, so the line starts where the Debts register
     * says it does.
     */
    private Walked walk(Map<Long, List<AmortisationEntry>> schedules,
                        Map<Long, BigDecimal> outstandingByLoan,
                        YearMonth start, YearMonth last) {
        if (schedules.isEmpty()) {
            return new Walked(List.of(), Map.of());
        }

        List<DebtTrajectory.Point> points = new ArrayList<>();
        Map<Long, List<BigDecimal>> balances = new LinkedHashMap<>();
        schedules.keySet().forEach(loanId -> balances.put(loanId, new ArrayList<>()));

        YearMonth month = start;
        for (int i = 0; i <= MAX_POINTS && !month.isAfter(last); i++, month = month.plusMonths(1)) {
            boolean first = points.isEmpty();
            BigDecimal owed = MoneyScale.ZERO;
            BigDecimal principal = MoneyScale.ZERO;
            BigDecimal interest = MoneyScale.ZERO;

            for (Map.Entry<Long, List<AmortisationEntry>> loan : schedules.entrySet()) {
                List<AmortisationEntry> schedule = loan.getValue();
                AmortisationEntry latest = null;
                for (AmortisationEntry entry : schedule) {
                    YearMonth due = YearMonth.from(entry.dueDate());
                    if (due.isAfter(month)) {
                        break;
                    }
                    latest = entry;
                    if (due.equals(month)) {
                        principal = principal.add(MoneyScale.normalise(entry.principalComponent()));
                        interest = interest.add(MoneyScale.normalise(entry.interestComponent()));
                    }
                }

                // The first point is today's figure per loan, for the same reason the total
                // is: the stack has to add to the line at every point, including this one.
                BigDecimal share = first
                        ? MoneyScale.normalise(outstandingByLoan.getOrDefault(loan.getKey(), MoneyScale.ZERO))
                        : latest != null
                                ? MoneyScale.normalise(latest.closingBalance())
                                : firstOpeningBalance(schedule);

                balances.get(loan.getKey()).add(share);
                owed = owed.add(share);
            }

            points.add(new DebtTrajectory.Point(month.atDay(1),
                    MoneyScale.normalise(owed),
                    // Null on the month in progress: the walk is forward-only, so an EMI due
                    // earlier this month is not in these sums, and zero would claim nothing
                    // was due. See the note on Point.
                    first ? null : principal,
                    first ? null : interest));
        }
        return new Walked(points, balances);
    }

    /** The curve and its bands, which are built together because they must agree. */
    private record Walked(List<DebtTrajectory.Point> points, Map<Long, List<BigDecimal>> balances) {
    }

    /** What a loan owes before its first remaining EMI: that EMI's closing balance plus the
     *  principal it takes off. Derived, not stored - the schedule is the only source. */
    private BigDecimal firstOpeningBalance(List<AmortisationEntry> schedule) {
        AmortisationEntry first = schedule.get(0);
        return MoneyScale.normalise(first.closingBalance().add(first.principalComponent()));
    }
}
