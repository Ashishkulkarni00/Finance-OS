package com.finance.position;

import com.finance.account.AccountBalanceCalculator;
import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.commitment.CommitmentInstanceRepository;
import com.finance.commitment.CommitmentRepository;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.CurrentCycleResolver;
import com.finance.cycle.domain.Cycle;
import com.finance.position.PositionResult.AccountAmount;
import com.finance.position.PositionResult.CommitmentAmount;
import com.finance.position.PositionResult.IncompleteBlocker;
import com.finance.reservation.ReservationRepository;
import com.finance.transaction.TransactionRepository;
import com.finance.transaction.domain.TransactionType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Real Balance, Room, and Net Worth - the product's reason to exist.
 *
 * <p><strong>Dependency note:</strong> this reads {@code CommitmentInstanceRepository}/
 * {@code CommitmentRepository} directly, and resolves the current cycle via
 * {@code CurrentCycleResolver} rather than {@code CycleService} - those services (or
 * things they depend on) would eventually loop back here (e.g. {@code CycleServiceImpl.close}
 * already calls this service), so going through them would be a circular bean
 * dependency. Same trade-off as {@code AccountBalanceCalculator} and
 * {@code CommitmentAutoMatcher}: these are pure reads with no business logic of their
 * own to duplicate, so reading them directly is the pragmatic side of that trade-off.
 */
@Service
public class PositionServiceImpl implements PositionService {

    private final AccountService accountService;
    private final AccountBalanceCalculator balanceCalculator;
    private final ReservationRepository reservationRepository;
    private final CurrentCycleResolver cycleResolver;
    private final CommitmentInstanceRepository instanceRepository;
    private final CommitmentRepository commitmentRepository;
    private final TransactionRepository transactionRepository;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public PositionServiceImpl(AccountService accountService,
                               AccountBalanceCalculator balanceCalculator,
                               ReservationRepository reservationRepository,
                               CurrentCycleResolver cycleResolver,
                               CommitmentInstanceRepository instanceRepository,
                               CommitmentRepository commitmentRepository,
                               TransactionRepository transactionRepository,
                               CurrentUserProvider currentUser,
                               Clock clock) {
        this.accountService = accountService;
        this.balanceCalculator = balanceCalculator;
        this.reservationRepository = reservationRepository;
        this.cycleResolver = cycleResolver;
        this.instanceRepository = instanceRepository;
        this.commitmentRepository = commitmentRepository;
        this.transactionRepository = transactionRepository;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    /**
     * Whether paying this bill takes money out of what's counted as held. Expected income
     * brings money in, and a transfer between two spendable accounts only moves it -
     * neither is spoken-for. A transfer to savings, an investment or an expense is.
     */
    private static boolean leavesHeldMoney(Commitment commitment, java.util.Set<Long> spendableIds) {
        return switch (commitment.getSettleAs()) {
            case INCOME, REFUND -> false;
            // Moving or investing money only reduces what's free when it leaves spending
            // money - a deposit from cash kept aside for the emergency fund doesn't.
            case TRANSFER -> spendableIds.contains(commitment.getAccountId())
                    && (commitment.getToAccountId() == null || !spendableIds.contains(commitment.getToAccountId()));
            case INVESTMENT -> spendableIds.contains(commitment.getAccountId());
            case EXPENSE -> true;
        };
    }

    // Not readOnly - resolving the current cycle can lazily insert a Cycle row on
    // first reference (CurrentCycleResolver), which a read-only connection rejects.
    @Override
    @Transactional
    public PositionResult currentPosition() {
        Long userId = currentUser.currentUserId();
        LocalDate today = LocalDate.now(clock);

        List<Account> activeAccounts = accountService.listActive();
        List<Account> spendableAccounts = activeAccounts.stream()
                .filter(Account::countsAsSpendable)
                .toList();

        BigDecimal held = BigDecimal.ZERO;
        List<AccountAmount> accountAmounts = new ArrayList<>();
        for (Account account : spendableAccounts) {
            BigDecimal balance = balanceCalculator.currentBalance(account);
            held = held.add(balance);
            accountAmounts.add(new AccountAmount(account.getId(), account.getName(), balance));
        }

        // Owed on credit cards. A swipe is spending on the day it happens, but the money
        // leaves the bank only when the bill is paid - so until then it's still in "held",
        // and without this line "free" would count the same rupees as available. Paying the
        // bill moves money from held to the card: held and card dues fall together, and
        // Real Balance doesn't move. Never counted twice. A card in credit owes nothing.
        BigDecimal cardDues = BigDecimal.ZERO;
        List<AccountAmount> cardAmounts = new ArrayList<>();
        for (Account account : activeAccounts) {
            if (account.getType() != AccountType.CREDIT_CARD) {
                continue;
            }
            BigDecimal owed = balanceCalculator.currentBalance(account).negate();
            if (owed.signum() > 0) {
                cardDues = cardDues.add(owed);
                cardAmounts.add(new AccountAmount(account.getId(), account.getName(), MoneyScale.normalise(owed)));
            }
        }

        BigDecimal reserved = reservationRepository.sumReservedForUser(userId);

        Cycle cycle = cycleResolver.resolve(userId, today);
        List<CommitmentInstance> open = instanceRepository.findOpenForCycle(userId, cycle.getId());

        List<IncompleteBlocker> blockers = new ArrayList<>();
        BigDecimal committed = BigDecimal.ZERO;
        BigDecimal optionalCommitted = BigDecimal.ZERO;
        List<CommitmentAmount> commitmentAmounts = new ArrayList<>();
        Map<Long, Commitment> commitmentsById = commitmentRepository.findAllById(
                        open.stream().map(CommitmentInstance::getCommitmentId).toList()).stream()
                .collect(Collectors.toMap(Commitment::getId, c -> c));

        java.util.Set<Long> spendableIds = spendableAccounts.stream().map(Account::getId)
                .collect(Collectors.toSet());
        for (CommitmentInstance instance : open) {
            Commitment commitment = commitmentsById.get(instance.getCommitmentId());
            if (commitment != null && !leavesHeldMoney(commitment, spendableIds)) {
                continue;
            }
            String name = commitment == null ? "A commitment" : commitment.getName();
            boolean mandatory = commitment == null || commitment.isMandatory();
            BigDecimal outstanding = instance.outstanding();

            if (outstanding == null && !mandatory) {
                // An optional bill with no amount yet can't be subtracted, and it isn't
                // important enough to withhold the whole figure - it stays out until it
                // gets an estimate (the plan row asks for one).
                continue;
            }
            if (outstanding == null) {
                // A mandatory instance with an unknown amount blocks Real Balance from
                // computing at all - Principle 1: never confidently wrong.
                // `fix` is followed as a link in the UI, so it must be a page in the app.
                // It used to be the settle *API* path, which no screen routes to - "Fix
                // this" on Today and Month led to a blank page.
                blockers.add(new IncompleteBlocker(instance.getId(), name,
                        "/commitments/" + instance.getId()));
                continue;
            }
            committed = committed.add(outstanding);
            if (!mandatory) {
                optionalCommitted = optionalCommitted.add(outstanding);
            }
            commitmentAmounts.add(new CommitmentAmount(instance.getId(), name, outstanding, mandatory));
        }

        if (!blockers.isEmpty()) {
            String reason = blockers.size() == 1
                    ? blockers.get(0).name() + " doesn't have an amount yet."
                    : blockers.size() + " mandatory commitments don't have an amount yet.";
            return new PositionResult(false, null, null, null, null, null, null, null, null, null,
                    accountAmounts, null, null, reason, blockers);
        }

        BigDecimal realBalance = MoneyScale.normalise(held.subtract(reserved).subtract(committed).subtract(cardDues));

        BigDecimal spentToday = spentOn(userId, today);
        long daysRemaining = ChronoUnit.DAYS.between(today, cycle.getEndDate()) + 1;
        BigDecimal roomToday = realBalance.add(spentToday)
                .divide(BigDecimal.valueOf(Math.max(daysRemaining, 1)), 2, RoundingMode.HALF_UP);
        BigDecimal roomLeft = roomToday.subtract(spentToday);

        return new PositionResult(true, realBalance, roomToday, roomLeft, MoneyScale.normalise(spentToday),
                MoneyScale.normalise(held), MoneyScale.normalise(reserved), MoneyScale.normalise(committed),
                MoneyScale.normalise(optionalCommitted),
                MoneyScale.normalise(cardDues), accountAmounts, cardAmounts, commitmentAmounts, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public NetWorthResult currentNetWorth() {
        List<Account> accounts = accountService.listActive();

        BigDecimal assets = BigDecimal.ZERO;
        BigDecimal liabilities = BigDecimal.ZERO;
        for (Account account : accounts) {
            BigDecimal balance = balanceCalculator.currentBalance(account);
            if (account.getType().isAsset()) {
                assets = assets.add(balance);
            }
            if (account.getType().isLiability()) {
                // Liability balances are negative (money owed) - negate to express as owed.
                liabilities = liabilities.add(balance.negate());
            }
        }

        BigDecimal netWorth = MoneyScale.normalise(assets.subtract(liabilities));
        return new NetWorthResult(netWorth, MoneyScale.normalise(assets), MoneyScale.normalise(liabilities),
                MoneyScale.normalise(liabilities));
    }

    @Override
    @Transactional(readOnly = true)
    public CashPosition currentCashPosition() {
        Long userId = currentUser.currentUserId();

        BigDecimal held = BigDecimal.ZERO;
        BigDecimal cardLiability = BigDecimal.ZERO;
        int count = 0;

        for (Account account : accountService.listActive()) {
            BigDecimal balance = balanceCalculator.currentBalance(account);
            if (account.countsAsSpendable()) {
                held = held.add(balance);
                count++;
            } else if (account.getType() == AccountType.CREDIT_CARD) {
                // Card balances are negative (money owed); state it as an amount owed.
                cardLiability = cardLiability.add(balance.negate());
            }
        }

        BigDecimal reserved = reservationRepository.sumReservedForUser(userId);
        return new CashPosition(
                MoneyScale.normalise(held),
                MoneyScale.normalise(reserved),
                MoneyScale.normalise(held.subtract(reserved)),
                MoneyScale.normalise(cardLiability),
                count);
    }

    private BigDecimal spentOn(Long userId, LocalDate date) {
        BigDecimal expense = transactionRepository.sumAmountByTypeInRange(userId, TransactionType.EXPENSE, date, date);
        BigDecimal refund = transactionRepository.sumAmountByTypeInRange(userId, TransactionType.REFUND, date, date);
        return expense.subtract(refund);
    }
}
