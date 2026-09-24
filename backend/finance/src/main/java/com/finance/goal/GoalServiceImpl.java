package com.finance.goal;

import com.finance.account.AccountBalanceCalculator;
import com.finance.account.AccountService;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.commitment.CommitmentInstanceRepository;
import com.finance.commitment.CommitmentMonthlyCost;
import com.finance.commitment.CommitmentRepository;
import com.finance.commitment.CommitmentService;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.transaction.domain.TransactionType;
import com.finance.goal.domain.Goal;
import com.finance.goal.dto.CreateGoalRequest;
import com.finance.goal.dto.UpdateGoalRequest;
import com.finance.plan.PlanChangeDraft;
import com.finance.plan.PlanRevisionRecorder;
import com.finance.plan.domain.PlanRevisionType;
import com.finance.reservation.ReservationRepository;
import com.finance.reservation.domain.Reservation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Business rules for goals. Progress is never stored - it is read at query time from the
 * place the goal watches ({@code linkedReservationId} or {@code linkedAccountId}) plus
 * anything set aside against it, wherever that sits. See {@link #currentAmount}.
 */
@Service
public class GoalServiceImpl implements GoalService {

    private static final Logger log = LoggerFactory.getLogger(GoalServiceImpl.class);

    private final GoalRepository repository;
    private final ReservationRepository reservationRepository;
    private final AccountService accountService;
    private final AccountBalanceCalculator balanceCalculator;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    private CommitmentService commitmentService;
    private CommitmentRepository commitmentRepository;
    private CommitmentInstanceRepository instanceRepository;
    private PlanRevisionRecorder planRevisions;

    /** Records what changed about the plan (ADR-0015). Optional for the same reason as the
     *  rest: a service built without it reads exactly as it did before history existed. */
    @Autowired(required = false)
    void setPlanRevisions(PlanRevisionRecorder planRevisions) {
        this.planRevisions = planRevisions;
    }

    /** Set after construction: goals and bills refer to each other. Optional so a read-only
     *  service (as the pace test builds) works without it. */
    @Autowired(required = false)
    void setCommitmentService(@Lazy CommitmentService commitmentService) {
        this.commitmentService = commitmentService;
    }

    /** The goal's planned payments are read from these. Optional for the same reason: without
     *  them a goal simply has no payments, and reads exactly as it did before they existed. */
    @Autowired(required = false)
    void setCommitmentRepositories(CommitmentRepository commitmentRepository,
                                   CommitmentInstanceRepository instanceRepository) {
        this.commitmentRepository = commitmentRepository;
        this.instanceRepository = instanceRepository;
    }

    public GoalServiceImpl(GoalRepository repository,
                           ReservationRepository reservationRepository,
                           AccountService accountService,
                           AccountBalanceCalculator balanceCalculator,
                           CurrentUserProvider currentUser,
                           Clock clock) {
        this.repository = repository;
        this.reservationRepository = reservationRepository;
        this.accountService = accountService;
        this.balanceCalculator = balanceCalculator;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Override
    @Transactional
    public GoalView create(CreateGoalRequest request) {
        Long userId = currentUser.currentUserId();
        requireAtMostOneLink(request.linkedReservationId(), request.linkedAccountId());

        Goal goal = Goal.builder()
                .userId(userId)
                .name(request.name().trim())
                .targetAmount(MoneyScale.normalise(request.targetAmount()))
                .targetDate(request.targetDate())
                .priority(request.priority() == null ? 0 : request.priority())
                .linkedReservationId(request.linkedReservationId())
                .linkedAccountId(request.linkedAccountId())
                .build();

        Goal saved = repository.save(goal);
        log.info("Goal created id={}", saved.getId());
        GoalView view = toView(saved);
        recordStartOrStop(view, PlanRevisionType.CREATED, true, request.reason());
        return view;
    }

    @Override
    @Transactional(readOnly = true)
    public GoalView getById(Long id) {
        return toView(requireOwned(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GoalView> list(boolean includeArchived, Pageable pageable) {
        return repository.findAllForUser(currentUser.currentUserId(), includeArchived, pageable).map(this::toView);
    }

    @Override
    @Transactional
    public GoalView update(Long id, UpdateGoalRequest request) {
        Goal goal = requireOwned(id);
        // The goal as it stands, including what it currently demands each month - the
        // "before" side of the revision this write records (ADR-0015).
        GoalPlanFields before = capture(toView(goal));

        if (request.name() != null) {
            String name = request.name().trim();
            if (name.isEmpty()) {
                throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                        "A goal needs a name you'll recognise.", "name");
            }
            goal.setName(name);
        }
        if (request.targetAmount() != null) {
            goal.setTargetAmount(MoneyScale.normalise(request.targetAmount()));
        }
        if (request.targetDate() != null) {
            goal.setTargetDate(request.targetDate());
        }
        if (request.priority() != null) {
            goal.setPriority(request.priority());
        }
        if (request.linkedReservationId() != null || request.linkedAccountId() != null) {
            requireAtMostOneLink(request.linkedReservationId(), request.linkedAccountId());
            if (request.linkedReservationId() != null) {
                goal.setLinkedReservationId(request.linkedReservationId());
                goal.setLinkedAccountId(null);
            } else {
                goal.setLinkedAccountId(request.linkedAccountId());
                goal.setLinkedReservationId(null);
            }
        }

        Goal saved = repository.save(goal);
        log.info("Goal updated id={}", saved.getId());
        // Recorded before the bills are synced, so the log reads in the order it happened:
        // the goal changed, then the bills that follow it changed with it.
        recordChange(toView(saved), before, PlanRevisionType.AMENDED, request.reason());
        syncBills(saved.getId());
        return toView(saved);
    }

    @Override
    @Transactional
    public GoalView archive(Long id) {
        Goal goal = requireOwned(id);
        if (!goal.isArchived()) {
            GoalView before = toView(goal);
            goal.archive();
            repository.save(goal);
            log.info("Goal archived id={}", id);
            // The effect is measured on what it demanded before it stopped.
            recordStartOrStop(before, PlanRevisionType.PAUSED, false, null);
            // Its monthly contribution stops with it.
            syncBills(id);
        }
        return toView(goal);
    }

    @Override
    @Transactional
    public GoalView unarchive(Long id) {
        Goal goal = requireOwned(id);
        if (goal.isArchived()) {
            goal.unarchive();
            repository.save(goal);
            log.info("Goal unarchived id={}", id);
            recordStartOrStop(toView(goal), PlanRevisionType.RESUMED, true, null);
        }
        return toView(goal);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Goal goal = requireOwned(id);
        GoalView before = toView(goal);
        goal.markDeleted();
        repository.save(goal);
        log.info("Goal soft-deleted id={}", id);
        // The revision outlives the goal - "I gave up on this in October" is worth keeping.
        recordStartOrStop(before, PlanRevisionType.ENDED, false, null);
        syncBills(id);
    }

    // ---------------------------------------------------------------------------------
    // Plan history (ADR-0015). A goal's target and date are plan, not metadata: moving a
    // target date changes what has to be found every month, and until now did so silently.
    // ---------------------------------------------------------------------------------

    /** Where the goal's money sits, by name - frozen at capture time so the log still reads
     *  correctly after a rename. Null when it tracks neither a reservation nor an account. */
    private String trackedIn(Goal goal) {
        try {
            if (goal.getLinkedReservationId() != null) {
                return reservationRepository.findById(goal.getLinkedReservationId())
                        .filter(r -> r.getDeletedAt() == null)
                        .map(Reservation::getPurpose)
                        .orElse(null);
            }
            if (goal.getLinkedAccountId() != null) {
                return accountService.getByIdIncludingDeleted(goal.getLinkedAccountId()).getName();
            }
        } catch (RuntimeException e) {
            // A courtesy for the log, never the reason a goal edit fails.
            return null;
        }
        return null;
    }

    private GoalPlanFields capture(GoalView view) {
        return GoalPlanFields.of(view, trackedIn(view.goal()));
    }

    /**
     * Records a goal change. The monthly effect is the change in what the goal demands each
     * month - null when either side is unknown, never zero (ADR-0006).
     */
    private void recordChange(GoalView after, GoalPlanFields before, PlanRevisionType type, String reason) {
        if (planRevisions == null) {
            return;
        }
        GoalPlanFields fields = capture(after);
        PlanChangeDraft draft = PlanChangeDraft
                .forGoal(after.goal().getId(), after.goal().getName(), type)
                .reason(reason)
                .monthlyEffect(before.requiredPerMonth(), fields.requiredPerMonth());
        before.diffInto(draft, fields);
        planRevisions.record(draft);
    }

    /** A goal that starts or stops: what it demands each month appears or disappears. */
    private void recordStartOrStop(GoalView view, PlanRevisionType type, boolean starting, String reason) {
        if (planRevisions == null) {
            return;
        }
        BigDecimal required = view.requiredPerMonth();
        planRevisions.record(PlanChangeDraft
                .forGoal(view.goal().getId(), view.goal().getName(), type)
                .reason(reason)
                .monthlyEffect(starting ? MoneyScale.ZERO : required,
                        starting ? required : MoneyScale.ZERO));
    }

    private void syncBills(Long goalId) {
        if (commitmentService != null) {
            commitmentService.syncSourceBills(CommitmentSource.GOAL, goalId);
        }
    }

    private GoalView toView(Goal goal) {
        BigDecimal saved = currentAmount(goal);
        LocalDate today = LocalDate.now(clock);
        List<Payment> payments = plannedPayments(goal, today);
        BigDecimal spent = payments.stream().map(Payment::paid).reduce(BigDecimal.ZERO, BigDecimal::add);
        // What the goal has done so far: what's still saved plus what's already been paid out
        // of it. A booking paid early moves money, not the goal backwards.
        BigDecimal covered = saved.add(spent);
        BigDecimal progressPercent = goal.getTargetAmount().signum() == 0
                ? BigDecimal.ZERO
                : covered.divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .min(BigDecimal.valueOf(100))
                        .max(BigDecimal.ZERO)
                        .setScale(2, RoundingMode.HALF_UP);

        List<GoalScheduleLine> schedule = schedule(goal, payments, saved);
        BigDecimal requiredPerMonth = payments.isEmpty()
                ? requiredByTargetDate(goal, covered, today)
                : requiredByTightestDeadline(schedule, today);

        BigDecimal timeElapsedPercent = timeElapsedPercent(goal, today);
        Funding funding = funding(goal);
        return new GoalView(goal, MoneyScale.normalise(saved), MoneyScale.normalise(spent), progressPercent,
                requiredPerMonth, funding.perMonth(), funding.varies(),
                pace(goal, covered, requiredPerMonth, funding, today), timeElapsedPercent, schedule);
    }

    /** What the plan puts in each month, and how much of it cannot be known. */
    private record Funding(BigDecimal perMonth, int varies) {
    }

    /**
     * What the plan actually puts into this goal each month.
     *
     * <p>Only bills that <em>fund</em> the goal count. A goal-linked bill settled as an
     * expense is a payment the goal is <em>for</em> — a trip's bookings — and paying for the
     * trip does not put money into saving for it ({@code SourceBillSync.applyGoal}).
     *
     * <p>A funding bill whose amount varies makes the total <strong>unknown, not smaller</strong>.
     * The user decides that figure each month, so no claim about "enough" can be read off the
     * plan (ADR-0006).
     */
    private Funding funding(Goal goal) {
        if (commitmentRepository == null) {
            return new Funding(null, 0);
        }
        BigDecimal perMonth = BigDecimal.ZERO;
        int varies = 0;
        for (Commitment bill : commitmentRepository.findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(
                CommitmentSource.GOAL, goal.getId(), goal.getUserId())) {
            if (bill.isArchived() || bill.getSettleAs() == TransactionType.EXPENSE) {
                continue;
            }
            // A one-off top-up is real money and is not a rate. Counting ₹30,000 once as
            // ₹30,000 every month would make an unfunded goal look comfortably funded.
            if (CommitmentMonthlyCost.isOneOff(bill)) {
                continue;
            }
            BigDecimal monthly = CommitmentMonthlyCost.of(bill);
            if (monthly == null) {
                varies++;
                continue;
            }
            perMonth = perMonth.add(monthly);
        }
        return new Funding(MoneyScale.normalise(perMonth), varies);
    }

    /**
     * Whether what is going in is enough to arrive on time. See {@link GoalPace} for why this
     * is no longer measured against the calendar.
     */
    private GoalPace pace(Goal goal, BigDecimal current, BigDecimal requiredPerMonth,
                          Funding funding, LocalDate today) {
        if (current.compareTo(goal.getTargetAmount()) >= 0) {
            return GoalPace.REACHED;
        }
        if (today.isAfter(goal.getTargetDate())) {
            return GoalPace.OVERDUE;
        }
        if (requiredPerMonth == null || funding.perMonth() == null) {
            return GoalPace.UNKNOWN;
        }
        if (requiredPerMonth.signum() <= 0) {
            // Nothing more is needed to arrive on time - the schedule already covers it.
            return GoalPace.ON_TRACK;
        }
        if (funding.varies() > 0) {
            return GoalPace.UNKNOWN;
        }
        // No tolerance. Short is short: ₹10,000 going in against ₹15,182 needed is not
        // "roughly on track", it is ₹5,182 a month short, every month.
        return funding.perMonth().compareTo(requiredPerMonth) < 0 ? GoalPace.BEHIND : GoalPace.ON_TRACK;
    }

    /** One planned payment: its date and amount, and what's been paid against it. */
    private record Payment(Long commitmentId, String name, LocalDate date, BigDecimal amount, BigDecimal paid) {
    }

    /**
     * A goal's payments are the bills linked to it that are paid as an expense - money
     * leaving for the goal on a date (a trip's bookings), as opposed to the transfers that
     * fund it. Each is read as one dated payment: its occurrence if one has been planned,
     * otherwise its first due date. A skipped one isn't counted.
     */
    private List<Payment> plannedPayments(Goal goal, LocalDate today) {
        if (commitmentRepository == null || instanceRepository == null) {
            return List.of();
        }
        List<Payment> payments = new ArrayList<>();
        for (Commitment bill : commitmentRepository.findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(
                CommitmentSource.GOAL, goal.getId(), goal.getUserId())) {
            if (bill.getSettleAs() != TransactionType.EXPENSE || bill.isArchived()) {
                continue;
            }
            List<CommitmentInstance> occurrences = instanceRepository
                    .findTop6ByCommitmentIdAndUserIdOrderByDueDateDesc(bill.getId(), goal.getUserId());
            CommitmentInstance first = occurrences.stream()
                    .min(Comparator.comparing(CommitmentInstance::getDueDate))
                    .orElse(null);
            if (first != null && first.getStatus() == CommitmentInstanceStatus.SKIPPED) {
                continue;
            }
            BigDecimal paid = occurrences.stream()
                    .map(CommitmentInstance::getConfirmedAmount)
                    .filter(java.util.Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            LocalDate date = first != null ? first.getDueDate() : firstDueDate(bill);
            BigDecimal amount = first != null && first.getExpectedAmount() != null ? first.getExpectedAmount() : bill.getFixedAmount();
            payments.add(new Payment(bill.getId(), bill.getName(), date, amount, paid));
        }
        payments.sort(Comparator.comparing(Payment::date));
        return payments;
    }

    /** The first date on or after the bill's start that falls on its due day. */
    private static LocalDate firstDueDate(Commitment bill) {
        LocalDate start = bill.getActiveFrom();
        LocalDate sameMonth = start.withDayOfMonth(Math.min(bill.getDueDay(), start.lengthOfMonth()));
        if (!sameMonth.isBefore(start)) {
            return sameMonth;
        }
        LocalDate next = start.plusMonths(1);
        return next.withDayOfMonth(Math.min(bill.getDueDay(), next.lengthOfMonth()));
    }

    /**
     * The goal's dated amounts, earliest first: each planned payment, then whatever part of
     * the target no payment accounts for, due on the goal's own date ("the rest, at the trip").
     * Walking them in order, each line says whether what's saved now covers everything due up
     * to and including it.
     */
    private List<GoalScheduleLine> schedule(Goal goal, List<Payment> payments, BigDecimal saved) {
        if (payments.isEmpty()) {
            return List.of();
        }
        List<Payment> lines = new ArrayList<>(payments);
        BigDecimal planned = payments.stream()
                .map(p -> p.amount() == null ? p.paid() : p.amount().max(p.paid()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal rest = goal.getTargetAmount().subtract(planned);
        if (rest.signum() > 0) {
            lines.add(new Payment(null, "The rest", goal.getTargetDate(), rest, BigDecimal.ZERO));
            lines.sort(Comparator.comparing(Payment::date));
        }

        List<GoalScheduleLine> schedule = new ArrayList<>();
        BigDecimal needed = BigDecimal.ZERO;
        BigDecimal available = saved.max(BigDecimal.ZERO);
        for (Payment line : lines) {
            if (line.amount() == null) {
                schedule.add(new GoalScheduleLine(line.commitmentId(), line.name(), line.date(), null,
                        MoneyScale.normalise(line.paid()), null, null, null, GoalScheduleLine.Status.AMOUNT_UNKNOWN));
                continue;
            }
            BigDecimal stillNeeded = line.amount().subtract(line.paid()).max(BigDecimal.ZERO);
            if (stillNeeded.signum() == 0) {
                schedule.add(new GoalScheduleLine(line.commitmentId(), line.name(), line.date(),
                        MoneyScale.normalise(line.amount()), MoneyScale.normalise(line.paid()), MoneyScale.normalise(BigDecimal.ZERO),
                        null, null, GoalScheduleLine.Status.PAID));
                continue;
            }
            needed = needed.add(stillNeeded);
            BigDecimal shortBy = needed.subtract(available).max(BigDecimal.ZERO);
            schedule.add(new GoalScheduleLine(line.commitmentId(), line.name(), line.date(),
                    MoneyScale.normalise(line.amount()), MoneyScale.normalise(line.paid()), MoneyScale.normalise(stillNeeded),
                    MoneyScale.normalise(needed), MoneyScale.normalise(shortBy),
                    shortBy.signum() > 0 ? GoalScheduleLine.Status.SHORT : GoalScheduleLine.Status.COVERED));
        }
        return schedule;
    }

    /** No payments planned: what's left of the target, spread over the months to its date. */
    private static BigDecimal requiredByTargetDate(Goal goal, BigDecimal covered, LocalDate today) {
        long monthsRemaining = ChronoUnit.MONTHS.between(today, goal.getTargetDate());
        if (monthsRemaining <= 0) {
            return null;
        }
        BigDecimal remaining = goal.getTargetAmount().subtract(covered);
        return remaining.signum() <= 0
                ? BigDecimal.ZERO
                : MoneyScale.normalise(remaining.divide(BigDecimal.valueOf(monthsRemaining), 10, RoundingMode.HALF_UP));
    }

    /**
     * With payments planned, the tightest deadline sets the pace: ₹5,000 short for a booking
     * next month needs ₹5,000 this month, even if the trip itself is three months away. A
     * deadline this month (or already passed) counts as one month - it's needed now.
     */
    private static BigDecimal requiredByTightestDeadline(List<GoalScheduleLine> schedule, LocalDate today) {
        BigDecimal required = BigDecimal.ZERO;
        for (GoalScheduleLine line : schedule) {
            if (line.status() != GoalScheduleLine.Status.SHORT) {
                continue;
            }
            long months = Math.max(1, ChronoUnit.MONTHS.between(today, line.date()));
            required = required.max(line.shortBy().divide(BigDecimal.valueOf(months), 10, RoundingMode.HALF_UP));
        }
        return MoneyScale.normalise(required);
    }

    /** Share of the goal's time gone: from the day it was added to its target date. */
    private BigDecimal timeElapsedPercent(Goal goal, LocalDate today) {
        if (goal.getCreatedAt() == null) {
            return null;
        }
        LocalDate start = LocalDate.ofInstant(goal.getCreatedAt(), clock.getZone());
        long total = ChronoUnit.DAYS.between(start, goal.getTargetDate());
        if (total <= 0) {
            return null;
        }
        long elapsed = Math.max(0, Math.min(total, ChronoUnit.DAYS.between(start, today)));
        return BigDecimal.valueOf(elapsed * 100).divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    /**
     * What this goal has, from wherever it actually is.
     *
     * <p>Two things, added together:
     * <ul>
     *   <li>the one place the goal <em>watches</em> - an account's balance, or a single
     *       reservation it was linked to when it was created;</li>
     *   <li><strong>anything set aside against it</strong>, wherever that sits. This is how
     *       money counts without having moved: last month's surplus, still physically in the
     *       salary account, earmarked for a trip and no longer spendable.</li>
     * </ul>
     *
     * <p>Before this, a goal could only count one place, so money reserved for it in a
     * different account was invisible to it - even though {@code reservations.goal_id} has
     * existed since V3 and the Set aside screen already said "counts as progress on a goal".
     *
     * <p>A reservation the goal is directly linked to is skipped in the second term, or it
     * would be counted twice.
     */
    private BigDecimal currentAmount(Goal goal) {
        BigDecimal watched = BigDecimal.ZERO;
        if (goal.getLinkedReservationId() != null) {
            watched = reservationRepository.findById(goal.getLinkedReservationId())
                    .filter(r -> r.getDeletedAt() == null)
                    .map(Reservation::getAmount)
                    .orElse(BigDecimal.ZERO);
        } else if (goal.getLinkedAccountId() != null) {
            watched = balanceCalculator.currentBalance(accountService.getByIdIncludingDeleted(goal.getLinkedAccountId()));
        }

        BigDecimal earmarked = reservationRepository
                .findByGoalIdAndUserIdAndDeletedAtIsNull(goal.getId(), goal.getUserId()).stream()
                .filter(r -> !r.getId().equals(goal.getLinkedReservationId()))
                .map(Reservation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return watched.add(earmarked);
    }

    private void requireAtMostOneLink(Long linkedReservationId, Long linkedAccountId) {
        if (linkedReservationId != null && linkedAccountId != null) {
            throw new BusinessRuleException(ErrorCode.GOAL_MULTIPLE_LINKS_NOT_ALLOWED,
                    "A goal tracks either a reservation or an account, not both.", "linkedAccountId");
        }
    }

    private Goal requireOwned(Long id) {
        return repository.findByIdAndUserIdAndDeletedAtIsNull(id, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.GOAL_NOT_FOUND,
                        "We couldn't find that goal. It may have been deleted."));
    }
}
