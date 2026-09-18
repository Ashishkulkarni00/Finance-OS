package com.finance.goal;

import com.finance.account.AccountBalanceCalculator;
import com.finance.account.AccountService;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.commitment.CommitmentService;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.goal.domain.Goal;
import com.finance.goal.dto.CreateGoalRequest;
import com.finance.goal.dto.UpdateGoalRequest;
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

/**
 * Business rules for goals. Progress is never stored - it is read from whichever of
 * {@code linkedReservationId}/{@code linkedAccountId} is set, at query time. See
 * {@code Goal}'s class comment.
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

    /** How far (in percentage points) saving may trail time before a goal reads as behind -
     *  a few days' slack, so a goal isn't flagged the day after a contribution is due. */
    static final BigDecimal PACE_TOLERANCE_POINTS = BigDecimal.valueOf(5);

    private CommitmentService commitmentService;

    /** Set after construction: goals and bills refer to each other. Optional so a read-only
     *  service (as the pace test builds) works without it. */
    @Autowired(required = false)
    void setCommitmentService(@Lazy CommitmentService commitmentService) {
        this.commitmentService = commitmentService;
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
        return toView(saved);
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
        syncBills(saved.getId());
        return toView(saved);
    }

    @Override
    @Transactional
    public GoalView archive(Long id) {
        Goal goal = requireOwned(id);
        if (!goal.isArchived()) {
            goal.archive();
            repository.save(goal);
            log.info("Goal archived id={}", id);
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
        }
        return toView(goal);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Goal goal = requireOwned(id);
        goal.markDeleted();
        repository.save(goal);
        log.info("Goal soft-deleted id={}", id);
        syncBills(id);
    }

    private void syncBills(Long goalId) {
        if (commitmentService != null) {
            commitmentService.syncSourceBills(CommitmentSource.GOAL, goalId);
        }
    }

    private GoalView toView(Goal goal) {
        BigDecimal current = currentAmount(goal);
        BigDecimal progressPercent = goal.getTargetAmount().signum() == 0
                ? BigDecimal.ZERO
                : current.divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .min(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);

        LocalDate today = LocalDate.now(clock);
        long monthsRemaining = ChronoUnit.MONTHS.between(today, goal.getTargetDate());
        BigDecimal requiredPerMonth = null;
        if (monthsRemaining > 0) {
            BigDecimal remaining = goal.getTargetAmount().subtract(current);
            requiredPerMonth = remaining.signum() <= 0
                    ? BigDecimal.ZERO
                    : MoneyScale.normalise(remaining.divide(BigDecimal.valueOf(monthsRemaining), 10, RoundingMode.HALF_UP));
        }

        BigDecimal timeElapsedPercent = timeElapsedPercent(goal, today);
        return new GoalView(goal, MoneyScale.normalise(current), progressPercent, requiredPerMonth,
                pace(goal, current, progressPercent, timeElapsedPercent, today), timeElapsedPercent);
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

    private GoalPace pace(Goal goal, BigDecimal current, BigDecimal progressPercent,
                          BigDecimal timeElapsedPercent, LocalDate today) {
        if (current.compareTo(goal.getTargetAmount()) >= 0) {
            return GoalPace.REACHED;
        }
        if (today.isAfter(goal.getTargetDate())) {
            return GoalPace.OVERDUE;
        }
        if (timeElapsedPercent == null) {
            return GoalPace.UNKNOWN;
        }
        return progressPercent.add(PACE_TOLERANCE_POINTS).compareTo(timeElapsedPercent) < 0
                ? GoalPace.BEHIND : GoalPace.ON_TRACK;
    }

    private BigDecimal currentAmount(Goal goal) {
        if (goal.getLinkedReservationId() != null) {
            return reservationRepository.findById(goal.getLinkedReservationId())
                    .filter(r -> r.getDeletedAt() == null)
                    .map(Reservation::getAmount)
                    .orElse(BigDecimal.ZERO);
        }
        if (goal.getLinkedAccountId() != null) {
            return balanceCalculator.currentBalance(accountService.getByIdIncludingDeleted(goal.getLinkedAccountId()));
        }
        return BigDecimal.ZERO;
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
