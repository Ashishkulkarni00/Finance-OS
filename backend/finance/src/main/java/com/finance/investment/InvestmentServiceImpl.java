package com.finance.investment;

import com.finance.account.AccountBalanceCalculator;
import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.commitment.CommitmentRepository;
import com.finance.commitment.CommitmentService;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.investment.domain.Investment;
import com.finance.investment.dto.CreateInvestmentRequest;
import com.finance.investment.dto.RecordValuationRequest;
import com.finance.investment.dto.UpdateInvestmentRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Business rules for investments.
 *
 * <p>Two rules do most of the work here. <strong>How much went in</strong> comes from the
 * holding's account balance, never from a stored copy - the account is fed by real
 * postings and a second stored figure would drift from it (ADR-0011). <strong>What it's
 * worth</strong> is the one thing the user maintains by hand, and until they do, every
 * figure derived from it is withheld rather than guessed at (ADR-0006).
 */
@Service
public class InvestmentServiceImpl implements InvestmentService {

    private static final Logger log = LoggerFactory.getLogger(InvestmentServiceImpl.class);

    private final InvestmentRepository repository;
    private final AccountService accountService;
    private final AccountBalanceCalculator balanceCalculator;
    private final CurrentUserProvider currentUser;
    private final Clock clock;
    private final CommitmentService commitmentService;
    private final CommitmentRepository commitmentRepository;

    public InvestmentServiceImpl(InvestmentRepository repository,
                                 AccountService accountService,
                                 AccountBalanceCalculator balanceCalculator,
                                 CurrentUserProvider currentUser,
                                 Clock clock,
                                 @Lazy CommitmentService commitmentService,
                                 CommitmentRepository commitmentRepository) {
        this.repository = repository;
        this.accountService = accountService;
        this.balanceCalculator = balanceCalculator;
        this.currentUser = currentUser;
        this.clock = clock;
        this.commitmentService = commitmentService;
        this.commitmentRepository = commitmentRepository;
    }

    @Override
    @Transactional
    public InvestmentView create(CreateInvestmentRequest request) {
        if (request.accountId() != null) {
            requireInvestmentAccount(request.accountId());
        }
        if (request.accountId() == null && request.statedInvested() == null) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "A holding with no account needs the amount invested, or there's nothing to show.",
                    "statedInvested");
        }

        Investment investment = Investment.builder()
                .userId(currentUser.currentUserId())
                .name(request.name().trim())
                .type(request.type())
                .accountId(request.accountId())
                .payFromAccountId(request.payFromAccountId())
                .monthlyContribution(MoneyScale.normalise(request.monthlyContribution()))
                .contributionDay(request.contributionDay())
                .statedInvested(MoneyScale.normalise(request.statedInvested()))
                .currentValue(MoneyScale.normalise(request.currentValue()))
                // Only dated when there is something to date.
                .currentValueAsOf(request.currentValue() == null ? null : LocalDate.now(clock))
                .confidence(request.confidence() != null ? request.confidence() : com.finance.account.domain.BalanceConfidence.ESTIMATED)
                .liquid(request.liquid() == null || request.liquid())
                .note(trimToNull(request.note()))
                .build();

        Investment saved = repository.save(investment);
        log.info("Investment created id={} type={}", saved.getId(), saved.getType());
        return toView(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public InvestmentView getById(Long id) {
        return toView(requireOwned(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvestmentView> list(Pageable pageable) {
        return repository.findByUserIdAndDeletedAtIsNull(currentUser.currentUserId(), pageable).map(this::toView);
    }

    @Override
    @Transactional
    public InvestmentView update(Long id, UpdateInvestmentRequest request) {
        Investment investment = requireOwned(id);

        if (request.name() != null) {
            investment.setName(request.name().trim());
        }
        if (request.type() != null) {
            investment.setType(request.type());
        }
        if (request.payFromAccountId() != null) {
            investment.setPayFromAccountId(request.payFromAccountId());
        }
        if (request.monthlyContribution() != null) {
            investment.setMonthlyContribution(MoneyScale.normalise(request.monthlyContribution()));
        }
        if (request.contributionDay() != null) {
            investment.setContributionDay(request.contributionDay());
        }
        if (request.statedInvested() != null) {
            investment.setStatedInvested(MoneyScale.normalise(request.statedInvested()));
        }
        if (request.confidence() != null) {
            investment.setConfidence(request.confidence());
        }
        if (request.liquid() != null) {
            investment.setLiquid(request.liquid());
        }
        if (request.note() != null) {
            investment.setNote(trimToNull(request.note()));
        }

        Investment saved = repository.save(investment);
        log.info("Investment updated id={}", saved.getId());
        // A bill that pays this instalment follows the holding.
        commitmentService.syncSourceBills(CommitmentSource.INVESTMENT, saved.getId());
        return toView(saved);
    }

    @Override
    @Transactional
    public InvestmentView recordValuation(Long id, RecordValuationRequest request) {
        Investment investment = requireOwned(id);
        investment.setCurrentValue(MoneyScale.normalise(request.currentValue()));
        // Stamped here, never taken from the caller: the whole point of the date is that
        // it says when someone actually looked.
        investment.setCurrentValueAsOf(request.asOf() != null ? request.asOf() : LocalDate.now(clock));

        Investment saved = repository.save(investment);
        log.info("Investment valued id={} asOf={}", saved.getId(), saved.getCurrentValueAsOf());
        return toView(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Investment investment = requireOwned(id);
        investment.markDeleted();
        repository.save(investment);
        log.info("Investment soft-deleted id={}", id);
        commitmentService.syncSourceBills(CommitmentSource.INVESTMENT, id);
    }

    @Override
    @Transactional(readOnly = true)
    public InvestmentSummary summary() {
        List<Investment> investments = repository.findByUserIdAndDeletedAtIsNull(currentUser.currentUserId());

        BigDecimal totalInvested = BigDecimal.ZERO;
        BigDecimal valuedInvested = BigDecimal.ZERO;
        BigDecimal currentValue = BigDecimal.ZERO;
        BigDecimal outsideLedger = BigDecimal.ZERO;
        BigDecimal illiquid = BigDecimal.ZERO;
        int valued = 0;
        BigDecimal monthly = BigDecimal.ZERO;
        // Kept per holding so the allocation below doesn't re-derive each balance.
        java.util.Map<Investment, BigDecimal> investedByHolding = new java.util.LinkedHashMap<>();

        for (Investment investment : investments) {
            BigDecimal invested = investedIn(investment);
            totalInvested = totalInvested.add(invested);
            investedByHolding.put(investment, invested);
            if (investment.getMonthlyContribution() != null) {
                monthly = monthly.add(investment.getMonthlyContribution());
            }

            if (investment.isOutsideLedger()) {
                outsideLedger = outsideLedger.add(invested);
            }
            if (!investment.isLiquid()) {
                illiquid = illiquid.add(invested);
            }
            if (investment.isValued()) {
                valued++;
                // Only what has been valued may be set against the current-value total -
                // comparing a full invested figure against a partial valuation would
                // manufacture a loss out of the holdings nobody has looked at.
                valuedInvested = valuedInvested.add(invested);
                currentValue = currentValue.add(investment.getCurrentValue());
            }
        }

        InvestmentSummary.ValuationState state = investments.isEmpty() || valued == 0
                ? InvestmentSummary.ValuationState.NONE_UPDATED
                : valued == investments.size()
                        ? InvestmentSummary.ValuationState.ALL_UPDATED
                        : InvestmentSummary.ValuationState.PARTLY_UPDATED;

        BigDecimal totalGain = valued == 0 ? null : MoneyScale.normalise(currentValue.subtract(valuedInvested));
        BigDecimal totalGainPercent = totalGain != null && valuedInvested.signum() > 0
                ? totalGain.divide(valuedInvested, 4, RoundingMode.HALF_UP)
                : null;

        final BigDecimal allInvested = totalInvested;
        List<InvestmentSummary.Allocation> allocation = investedByHolding.entrySet().stream()
                .sorted(java.util.Map.Entry.<Investment, BigDecimal>comparingByValue().reversed())
                .map(e -> new InvestmentSummary.Allocation(
                        e.getKey().getId(),
                        e.getKey().getName(),
                        MoneyScale.normalise(e.getValue()),
                        allInvested.signum() > 0 ? e.getValue().divide(allInvested, 4, RoundingMode.HALF_UP) : null,
                        e.getKey().isLiquid()))
                .toList();

        return new InvestmentSummary(
                investments.size(),
                MoneyScale.normalise(totalInvested),
                MoneyScale.normalise(valuedInvested),
                MoneyScale.normalise(currentValue),
                totalGain,
                totalGainPercent,
                MoneyScale.normalise(outsideLedger),
                MoneyScale.normalise(illiquid),
                valued,
                state,
                MoneyScale.normalise(totalInvested.subtract(illiquid)),
                MoneyScale.normalise(monthly),
                allocation);
    }

    private InvestmentView toView(Investment investment) {
        Account account = investment.getAccountId() == null
                ? null : accountService.getByIdIncludingDeleted(investment.getAccountId());
        Account payFrom = investment.getPayFromAccountId() == null
                ? null : accountService.getByIdIncludingDeleted(investment.getPayFromAccountId());

        BigDecimal opening;
        BigDecimal addedSince;
        BigDecimal totalInvested;
        if (account != null) {
            // The account is fed by real postings, so it is the truth about what went in.
            opening = account.getOpeningBalance();
            totalInvested = balanceCalculator.currentBalance(account);
            addedSince = MoneyScale.normalise(totalInvested.subtract(opening));
        } else {
            opening = investment.getStatedInvested();
            totalInvested = investment.getStatedInvested();
            // Not zero: nothing is recorded for this holding, so there is no figure at
            // all, and "₹0 added" would be a claim we cannot support.
            addedSince = null;
        }

        BigDecimal gain = null;
        BigDecimal gainPercent = null;
        Integer valuationAge = null;
        if (investment.isValued()) {
            gain = MoneyScale.normalise(investment.getCurrentValue().subtract(totalInvested));
            if (totalInvested.signum() > 0) {
                gainPercent = gain.divide(totalInvested, 4, RoundingMode.HALF_UP);
            }
            valuationAge = (int) ChronoUnit.DAYS.between(investment.getCurrentValueAsOf(), LocalDate.now(clock));
        }

        Long planCommitmentId = commitmentRepository.findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(
                        CommitmentSource.INVESTMENT, investment.getId(), investment.getUserId()).stream()
                .map(Commitment::getId).findFirst().orElse(null);
        return new InvestmentView(investment, account, payFrom, opening, addedSince, totalInvested,
                gain, gainPercent, valuationAge, planCommitmentId);
    }

    /** What has gone into one holding, by the same rule {@code toView} uses. */
    private BigDecimal investedIn(Investment investment) {
        if (investment.getAccountId() == null) {
            return investment.getStatedInvested() == null ? BigDecimal.ZERO : investment.getStatedInvested();
        }
        return balanceCalculator.currentBalance(accountService.getByIdIncludingDeleted(investment.getAccountId()));
    }

    private Account requireInvestmentAccount(Long accountId) {
        Account account = accountService.getById(accountId);
        if (account.getType() != AccountType.INVESTMENT) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "That account isn't an investment account.", "accountId");
        }
        return account;
    }

    private Investment requireOwned(Long id) {
        return repository.findByIdAndUserIdAndDeletedAtIsNull(id, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "We couldn't find that investment."));
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
