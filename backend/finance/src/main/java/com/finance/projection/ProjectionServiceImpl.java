package com.finance.projection;

import com.finance.account.AccountBalanceCalculator;
import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.commitment.CommitmentInstanceRepository;
import com.finance.commitment.CommitmentRepository;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.CurrentCycleResolver;
import com.finance.cycle.domain.Cycle;
import com.finance.projection.ProjectionResult.Deduction;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * The shortfall detector: {@code balance − Σ open instances hitting this account
 * before the next pay date}. See {@code ProjectionResult} for what's deliberately
 * left out (expected income has no recurring model in this build).
 *
 * <p>Same circular-dependency reasoning as {@code PositionServiceImpl}: reads
 * {@code CommitmentInstanceRepository}/{@code CommitmentRepository} directly and
 * resolves the cycle via {@code CurrentCycleResolver}, never through
 * {@code CommitmentService}/{@code CycleService}.
 */
@Service
public class ProjectionServiceImpl implements ProjectionService {

    private final AccountService accountService;
    private final AccountBalanceCalculator balanceCalculator;
    private final CurrentCycleResolver cycleResolver;
    private final CommitmentInstanceRepository instanceRepository;
    private final CommitmentRepository commitmentRepository;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public ProjectionServiceImpl(AccountService accountService,
                                 AccountBalanceCalculator balanceCalculator,
                                 CurrentCycleResolver cycleResolver,
                                 CommitmentInstanceRepository instanceRepository,
                                 CommitmentRepository commitmentRepository,
                                 CurrentUserProvider currentUser,
                                 Clock clock) {
        this.accountService = accountService;
        this.balanceCalculator = balanceCalculator;
        this.cycleResolver = cycleResolver;
        this.instanceRepository = instanceRepository;
        this.commitmentRepository = commitmentRepository;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    // Not readOnly - see the identical note on PositionServiceImpl.currentPosition.
    @Override
    @Transactional
    public ProjectionResult projectAccount(Long accountId) {
        Long userId = currentUser.currentUserId();
        Account account = accountService.getById(accountId);
        BigDecimal currentBalance = balanceCalculator.currentBalance(account);

        Cycle cycle = cycleResolver.resolve(userId, LocalDate.now(clock));
        List<CommitmentInstance> hitting = new ArrayList<>(instanceRepository.findAllOpenForCycleAndAccount(
                userId, cycle.getId(), accountId));
        // Due-date order, so each bill's balanceAfter reflects only the bills before it.
        hitting.sort(Comparator.comparing(CommitmentInstance::getDueDate).thenComparing(CommitmentInstance::getId));

        // A shortfall only means something for money that's supposed to stay
        // non-negative. A credit card sitting at -6,375 is normal, not a shortfall.
        BigDecimal floor = account.getMinimumBalance() != null ? account.getMinimumBalance() : BigDecimal.ZERO;
        boolean mustStayAboveFloor = account.getType().isSpendable();

        BigDecimal totalDeductions = BigDecimal.ZERO;
        List<Deduction> deductions = new ArrayList<>();
        for (CommitmentInstance instance : hitting) {
            BigDecimal outstanding = instance.outstanding();
            if (outstanding == null) {
                // Unknown amount - can't include it in a number, so it's left out of
                // the projection rather than guessed. (Real Balance is the endpoint
                // that refuses to compute entirely; a projection degrades gracefully.)
                continue;
            }
            Commitment commitment = commitmentRepository.findById(instance.getCommitmentId()).orElse(null);
            // Expected income arrives rather than leaves; it isn't a deduction.
            if (commitment != null && commitment.getSettleAs() == com.finance.transaction.domain.TransactionType.INCOME) {
                continue;
            }
            String name = commitment == null ? "A commitment" : commitment.getName();
            totalDeductions = totalDeductions.add(outstanding);
            BigDecimal balanceAfter = MoneyScale.normalise(currentBalance.subtract(totalDeductions));
            Boolean covered = mustStayAboveFloor ? balanceAfter.compareTo(floor) >= 0 : null;
            deductions.add(new Deduction(instance.getId(), name, instance.getDueDate(), outstanding, balanceAfter, covered));
        }

        BigDecimal projectedBalance = MoneyScale.normalise(currentBalance.subtract(totalDeductions));
        boolean shortfall = mustStayAboveFloor && projectedBalance.compareTo(floor) < 0;

        return new ProjectionResult(account.getId(), account.getName(), MoneyScale.normalise(currentBalance),
                projectedBalance, cycle.getEndDate(), shortfall, deductions);
    }
}
