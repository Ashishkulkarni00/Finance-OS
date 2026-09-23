package com.finance.loan;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.UpdateAccountRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.commitment.CommitmentRepository;
import com.finance.commitment.CommitmentService;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.loan.domain.Loan;
import com.finance.loan.domain.LoanConfidence;
import com.finance.loan.domain.LoanStatus;
import com.finance.loan.domain.RateType;
import com.finance.loan.dto.CreateLoanRequest;
import com.finance.loan.dto.UpdateLoanRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Business rules for loans. The amortisation schedule ({@code AmortisationCalculator})
 * is the source of truth for outstanding principal and payoff date - self-consistent
 * from principal/rate/tenure/EMI regardless of exactly how each EMI was recorded as a
 * transaction, which is what "turns TBD principal figures into a real net worth" means
 * in practice. See MVP_DEFINITION.md M7.
 */
@Service
public class LoanServiceImpl implements LoanService {

    private static final Logger log = LoggerFactory.getLogger(LoanServiceImpl.class);

    private final LoanRepository repository;
    private final AmortisationCalculator calculator;
    private final LoanPaymentRepository paymentRepository;
    private final AccountService accountService;
    private final CurrentUserProvider currentUser;
    private final Clock clock;
    private final CommitmentService commitmentService;
    private final CommitmentRepository commitmentRepository;

    public LoanServiceImpl(LoanRepository repository,
                           AmortisationCalculator calculator,
                           AccountService accountService,
                           CurrentUserProvider currentUser,
                           Clock clock,
                           @Lazy CommitmentService commitmentService,
                           CommitmentRepository commitmentRepository,
                           LoanPaymentRepository paymentRepository) {
        this.repository = repository;
        this.calculator = calculator;
        this.accountService = accountService;
        this.currentUser = currentUser;
        this.clock = clock;
        this.commitmentService = commitmentService;
        this.commitmentRepository = commitmentRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional
    public LoanView create(CreateLoanRequest request) {
        Long userId = currentUser.currentUserId();
        Account account = requireLoanAccount(request.accountId());

        // No rate supplied means the terms were never sourced - that's TBD, not a loan
        // we quietly treat as precise. Anything else defaults to ESTIMATED: derived from
        // what was stated, which is honest without over-claiming.
        requireNotInFuture(request.balanceAsOf());

        LoanConfidence confidence = request.confidence() != null
                ? request.confidence()
                : request.annualRate() == null ? LoanConfidence.TBD : LoanConfidence.ESTIMATED;

        // The EMI day follows the first EMI when one is given; otherwise the balance date's.
        Integer emiDay = request.emiDay() != null
                ? request.emiDay()
                : request.firstEmiDate() != null ? request.firstEmiDate().getDayOfMonth() : request.balanceAsOf().getDayOfMonth();

        Loan loan = Loan.builder()
                .userId(userId)
                .accountId(request.accountId())
                .lender(request.lender().trim())
                .outstandingBalance(MoneyScale.normalise(request.outstandingBalance()))
                .balanceAsOf(request.balanceAsOf())
                .emisRemaining(request.emisRemaining())
                .firstEmiDate(request.firstEmiDate())
                .principal(request.principal() == null ? null : MoneyScale.normalise(request.principal()))
                .annualRate(request.annualRate())
                .tenureMonths(request.tenureMonths())
                .startDate(request.startDate())
                .originalFirstEmiDate(request.originalFirstEmiDate())
                .emi(MoneyScale.normalise(request.emi()))
                .paidVia(request.paidVia())
                .confidence(confidence)
                .status(request.status() != null ? request.status() : LoanStatus.ACTIVE)
                .emiDay(emiDay)
                .payFromAccountId(request.payFromAccountId())
                .rateType(request.rateType() != null ? request.rateType() : RateType.FIXED)
                .note(trimToNull(request.note()))
                .build();

        requireFirstEmiAfterBalanceDate(loan);
        Loan saved = repository.save(loan);
        log.info("Loan created id={} accountId={}", saved.getId(), account.getId());
        return toView(saved, account);
    }

    @Override
    @Transactional(readOnly = true)
    public LoanView getById(Long id) {
        Loan loan = requireOwned(id);
        return toView(loan, accountService.getByIdIncludingDeleted(loan.getAccountId()));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LoanView> list(Pageable pageable) {
        return repository.findByUserIdAndDeletedAtIsNull(currentUser.currentUserId(), pageable)
                .map(loan -> toView(loan, accountService.getByIdIncludingDeleted(loan.getAccountId())));
    }

    @Override
    @Transactional
    public LoanView update(Long id, UpdateLoanRequest request) {
        Loan loan = requireOwned(id);

        if (request.lender() != null) {
            loan.setLender(request.lender().trim());
        }

        // Where the loan stands - the checkpoint every figure is derived forward from.
        // Recorded payments move it from here (ROADMAP 0.2); re-stating it is how a
        // balance that has drifted from the lender's own figure is corrected.
        boolean outstandingChanged = request.outstandingBalance() != null
                && request.outstandingBalance().compareTo(loan.getOutstandingBalance()) != 0;
        boolean asOfChanged = request.balanceAsOf() != null && !request.balanceAsOf().equals(loan.getBalanceAsOf());
        if (outstandingChanged) {
            loan.setOutstandingBalance(MoneyScale.normalise(request.outstandingBalance()));
        }
        if (asOfChanged) {
            requireNotInFuture(request.balanceAsOf());
            loan.setBalanceAsOf(request.balanceAsOf());
        }
        if (request.emisRemaining() != null) {
            loan.setEmisRemaining(request.emisRemaining());
        }
        if (request.firstEmiDate() != null) {
            loan.setFirstEmiDate(request.firstEmiDate());
        }

        // The original loan - background only; nothing is derived from it.
        if (request.principal() != null) {
            loan.setPrincipal(MoneyScale.normalise(request.principal()));
        }
        if (request.tenureMonths() != null) {
            loan.setTenureMonths(request.tenureMonths());
        }
        if (request.startDate() != null) {
            loan.setStartDate(request.startDate());
        }
        if (request.originalFirstEmiDate() != null) {
            loan.setOriginalFirstEmiDate(request.originalFirstEmiDate());
        }

        // Rate, with confidence following it the same way create() decides it: no rate
        // means the terms were never sourced (TBD); a rate on a TBD loan makes it at least
        // ESTIMATED. An explicit confidence in the same request still wins, below.
        if (Boolean.TRUE.equals(request.clearAnnualRate())) {
            loan.setAnnualRate(null);
            loan.setConfidence(LoanConfidence.TBD);
        } else if (request.annualRate() != null) {
            loan.setAnnualRate(request.annualRate());
            if (loan.getConfidence() == LoanConfidence.TBD) {
                loan.setConfidence(LoanConfidence.ESTIMATED);
            }
        }
        if (request.emi() != null) {
            loan.setEmi(MoneyScale.normalise(request.emi()));
        }
        if (request.paidVia() != null) {
            loan.setPaidVia(request.paidVia());
        }
        if (request.confidence() != null) {
            loan.setConfidence(request.confidence());
        }
        if (request.status() != null) {
            loan.setStatus(request.status());
        }
        if (request.emiDay() != null) {
            loan.setEmiDay(request.emiDay());
        }
        if (Boolean.TRUE.equals(request.clearPayFromAccount())) {
            loan.setPayFromAccountId(null);
        } else if (request.payFromAccountId() != null) {
            loan.setPayFromAccountId(request.payFromAccountId());
        }
        if (request.rateType() != null) {
            loan.setRateType(request.rateType());
        }
        if (request.note() != null) {
            loan.setNote(trimToNull(request.note()));
        }

        requireFirstEmiAfterBalanceDate(loan);
        Loan saved = repository.save(loan);

        // Keep the loan's own LOAN account in step: its opening balance is what was owed on
        // the loan's balance date, so a corrected amount or date that left the account alone
        // would have the loan and its account disagreeing about the debt.
        if (outstandingChanged || asOfChanged) {
            accountService.update(saved.getAccountId(), new UpdateAccountRequest(
                    null, null, null,
                    saved.getOutstandingBalance().negate(), saved.getBalanceAsOf(), null,
                    null, null, null, null, null, null));
        }

        log.info("Loan updated id={}", saved.getId());
        // A bill that pays this EMI follows the loan - keep it in step.
        commitmentService.syncLoanBills(saved.getId());
        return toView(saved, accountService.getByIdIncludingDeleted(saved.getAccountId()));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Loan loan = requireOwned(id);
        loan.markDeleted();
        repository.save(loan);
        log.info("Loan soft-deleted id={}", id);
        // Its EMI bill ends today rather than asking for payments on a loan that's gone.
        commitmentService.syncLoanBills(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AmortisationEntry> schedule(Long id) {
        Loan loan = requireOwned(id);
        return calculator.schedule(loan);
    }

    @Override
    @Transactional(readOnly = true)
    public LoanSummary summary() {
        Long userId = currentUser.currentUserId();
        List<Loan> loans = repository.findByUserIdAndDeletedAtIsNull(userId);

        // One query for every loan's recorded payments, not one per loan.
        Map<Long, Long> paidByLoan = paymentRepository.findPaidAmountsForUser(userId).stream()
                .collect(Collectors.groupingBy(LoanPaymentAmountByLoan::getLoanId, Collectors.counting()));

        BigDecimal bankEmi = BigDecimal.ZERO;
        BigDecimal cardEmi = BigDecimal.ZERO;
        BigDecimal remaining = BigDecimal.ZERO;
        int unconfirmed = 0;
        int tbd = 0;

        for (Loan loan : loans) {
            if (loan.getStatus() == LoanStatus.CLOSED) {
                continue;
            }
            // Never summed together - see LoanSummary for why.
            if (loan.debitsBankDirectly()) {
                bankEmi = bankEmi.add(loan.getEmi());
            } else {
                cardEmi = cardEmi.add(loan.getEmi());
            }

            // Recorded payments, not elapsed dates - the same rule as the loan's own page.
            int paid = paidByLoan.getOrDefault(loan.getId(), 0L).intValue();
            int emisLeft = Math.max(0, loan.getEmisRemaining() - paid);
            remaining = remaining.add(loan.getEmi().multiply(BigDecimal.valueOf(emisLeft)));

            if (loan.getStatus() == LoanStatus.UNCONFIRMED) {
                unconfirmed++;
            }
            if (loan.getConfidence() == LoanConfidence.TBD) {
                tbd++;
            }
        }

        return new LoanSummary(loans.size(), MoneyScale.normalise(bankEmi), MoneyScale.normalise(cardEmi),
                MoneyScale.normalise(remaining), unconfirmed, tbd);
    }

    /**
     * Everything derived forward from where the loan stands (V13).
     *
     * <p>EMIs left, still to pay and the payoff date come from the EMI count and the
     * calendar, so they need no rate. Outstanding today is the stated balance until the
     * first EMI after it falls due; after that it needs the rate to know how much of each
     * EMI was principal, and is withheld without one rather than guessed (ADR-0006).
     */
    private LoanView toView(Loan loan, Account account) {
        LocalDate today = LocalDate.now(clock);
        int remainingAtBalanceDate = loan.getEmisRemaining();

        // What was actually paid, in period order - the evidence the balance moves on
        // (ROADMAP 0.2). Before this, progress was counted by the calendar, so a loan
        // shrank on its due date whether or not the money had left.
        List<BigDecimal> paidAmounts = paymentRepository.findPaidAmounts(loan.getId(), loan.getUserId())
                .stream().map(LoanPaymentAmount::getAmount).toList();
        int paidPeriods = paidAmounts.size();

        // How many *should* have been paid by now. The gap is reported, never assumed -
        // neither "it must have been paid" nor "they've defaulted" is ours to decide.
        int due = calculator.emisElapsed(loan, today);
        int unrecorded = Math.max(0, due - paidPeriods);
        LocalDate oldestUnrecordedDue = unrecorded > 0 ? calculator.dueDate(loan, paidPeriods + 1) : null;

        int emisLeft = Math.max(0, remainingAtBalanceDate - paidPeriods);
        BigDecimal remainingPayments = MoneyScale.normalise(loan.getEmi().multiply(BigDecimal.valueOf(emisLeft)));
        LocalDate payoffDate = remainingAtBalanceDate > 0 ? calculator.dueDate(loan, remainingAtBalanceDate) : null;

        BigDecimal outstanding = null;
        if (paidPeriods == 0) {
            outstanding = loan.getOutstandingBalance();
        } else if (loan.getConfidence().supportsDerivedFigures() && loan.getAnnualRate() != null) {
            // Amortised by what was actually paid, so paying more than the EMI takes the
            // surplus off the principal and the loan clears sooner.
            outstanding = calculator.balanceAfterPayments(loan.getOutstandingBalance(), loan.getAnnualRate(), paidAmounts);
        }

        // Do the figures the user entered agree? Within one EMI, to allow for how banks round.
        Integer implied = loan.getAnnualRate() == null ? null : calculator.impliedEmis(loan);
        Boolean consistent = implied == null ? null : implied >= 0 && Math.abs(implied - remainingAtBalanceDate) <= 1;

        Account payFrom = loan.getPayFromAccountId() == null
                ? null : accountService.getByIdIncludingDeleted(loan.getPayFromAccountId());

        Long planCommitmentId = commitmentRepository.findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(
                        CommitmentSource.LOAN, loan.getId(), loan.getUserId()).stream()
                .map(Commitment::getId).findFirst().orElse(null);

        return new LoanView(loan, account, payFrom, outstanding, payoffDate, paidPeriods, unrecorded,
                oldestUnrecordedDue, emisLeft, remainingPayments,
                calculator.firstDueDate(loan), implied, consistent, planCommitmentId);
    }

    /** A balance can't be true as of a day that hasn't happened - same rule as accounts. */
    private void requireNotInFuture(LocalDate balanceAsOf) {
        if (balanceAsOf != null && balanceAsOf.isAfter(LocalDate.now(clock))) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "That date is in the future. Use the date the amount owed was actually true.", "balanceAsOf");
        }
    }

    /** An EMI on or before the balance date is already inside that balance. */
    private void requireFirstEmiAfterBalanceDate(Loan loan) {
        if (loan.getFirstEmiDate() != null && !loan.getFirstEmiDate().isAfter(loan.getBalanceAsOf())) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "The next EMI has to fall after the date the amount owed is true for - an EMI on or "
                            + "before that date is already inside that amount.", "firstEmiDate");
        }
        if (loan.getOriginalFirstEmiDate() != null && loan.getStartDate() != null
                && loan.getOriginalFirstEmiDate().isBefore(loan.getStartDate())) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "The first EMI can't be before the loan was disbursed.", "originalFirstEmiDate");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Account requireLoanAccount(Long accountId) {
        Account account = accountService.getById(accountId);
        if (account.getType() != AccountType.LOAN) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "That account isn't a loan.", "accountId");
        }
        return account;
    }

    private Loan requireOwned(Long id) {
        return repository.findByIdAndUserIdAndDeletedAtIsNull(id, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "We couldn't find that loan."));
    }
}
