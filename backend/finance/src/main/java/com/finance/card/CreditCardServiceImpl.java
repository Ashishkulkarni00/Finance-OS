package com.finance.card;

import com.finance.account.AccountBalanceCalculator;
import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.account.dto.UpdateAccountRequest;
import com.finance.card.domain.CardStatement;
import com.finance.card.domain.CreditCardTerms;
import com.finance.card.domain.StatementStatus;
import com.finance.card.dto.CreateCreditCardRequest;
import com.finance.card.dto.CreateCreditCardTermsRequest;
import com.finance.card.dto.UpdateCreditCardRequest;
import com.finance.card.dto.UpdateCreditCardTermsRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.loan.AmortisationCalculator;
import com.finance.loan.LoanRepository;
import com.finance.loan.domain.Loan;
import com.finance.loan.domain.LoanStatus;
import com.finance.transaction.PostingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Credit cards as one thing: the card's own liability account, its terms, its latest
 * bill and the EMIs charged to it.
 *
 * <p>A credit card is not attached to a bank account. It is its own account: a swipe is
 * an expense on it the day it happens, and paying the bill is a transfer into it. The
 * bank it's "usually paid from" is only a suggestion for the Pay bill form.
 *
 * <p>Every figure here is derived on read (ADR-0011) - from the card's postings, its typed
 * statements and the loans that pay from it.
 */
@Service
public class CreditCardServiceImpl implements CreditCardService {

    private static final Logger log = LoggerFactory.getLogger(CreditCardServiceImpl.class);

    private final AccountService accountService;
    private final AccountBalanceCalculator balanceCalculator;
    private final CardService cardService;
    private final CreditCardTermsRepository termsRepository;
    private final CardStatementRepository statementRepository;
    private final PostingRepository postingRepository;
    private final CardDueDateCalculator dueDates;
    private final LoanRepository loanRepository;
    private final AmortisationCalculator amortisationCalculator;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public CreditCardServiceImpl(AccountService accountService,
                                 AccountBalanceCalculator balanceCalculator,
                                 CardService cardService,
                                 CreditCardTermsRepository termsRepository,
                                 CardStatementRepository statementRepository,
                                 PostingRepository postingRepository,
                                 CardDueDateCalculator dueDates,
                                 LoanRepository loanRepository,
                                 AmortisationCalculator amortisationCalculator,
                                 CurrentUserProvider currentUser,
                                 Clock clock) {
        this.accountService = accountService;
        this.balanceCalculator = balanceCalculator;
        this.cardService = cardService;
        this.termsRepository = termsRepository;
        this.statementRepository = statementRepository;
        this.postingRepository = postingRepository;
        this.dueDates = dueDates;
        this.loanRepository = loanRepository;
        this.amortisationCalculator = amortisationCalculator;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public CreditCardsOverview list() {
        Long userId = currentUser.currentUserId();
        LocalDate today = LocalDate.now(clock);
        List<Loan> loans = loanRepository.findByUserIdAndDeletedAtIsNull(userId);

        List<CreditCardView> cards = accountService.listActive().stream()
                .filter(a -> a.getType() == AccountType.CREDIT_CARD)
                .sorted(Comparator.comparing(Account::getName, String.CASE_INSENSITIVE_ORDER))
                .map(a -> toView(a, loans, today))
                .toList();

        BigDecimal totalOutstanding = BigDecimal.ZERO;
        BigDecimal owedOnSetUp = BigDecimal.ZERO;
        BigDecimal totalLimit = BigDecimal.ZERO;
        BigDecimal totalAvailable = BigDecimal.ZERO;
        BigDecimal billsDueTotal = BigDecimal.ZERO;
        BigDecimal emiTotal = BigDecimal.ZERO;
        int billsDue = 0;

        for (CreditCardView card : cards) {
            BigDecimal owed = card.outstanding().max(BigDecimal.ZERO);
            totalOutstanding = totalOutstanding.add(owed);
            if (card.terms() != null) {
                owedOnSetUp = owedOnSetUp.add(owed);
                totalLimit = totalLimit.add(card.terms().getCreditLimit());
                totalAvailable = totalAvailable.add(card.availableCredit());
            }
            if (card.latestStatement() != null && card.latestStatement().status() != StatementStatus.PAID) {
                billsDue++;
                billsDueTotal = billsDueTotal.add(card.latestStatement().remaining());
            }
            emiTotal = emiTotal.add(card.emiMonthlyTotal());
        }

        BigDecimal utilisation = totalLimit.signum() > 0 ? owedOnSetUp.divide(totalLimit, 4, RoundingMode.HALF_UP) : null;
        return new CreditCardsOverview(MoneyScale.normalise(totalOutstanding), MoneyScale.normalise(totalLimit),
                MoneyScale.normalise(totalAvailable), utilisation, billsDue, MoneyScale.normalise(billsDueTotal),
                MoneyScale.normalise(emiTotal), cards);
    }

    @Override
    @Transactional(readOnly = true)
    public CreditCardView get(Long accountId) {
        Account account = requireCard(accountId);
        return toView(account, loanRepository.findByUserIdAndDeletedAtIsNull(account.getUserId()), LocalDate.now(clock));
    }

    @Override
    @Transactional
    public CreditCardView create(CreateCreditCardRequest request) {
        BigDecimal owed = request.outstanding() == null ? BigDecimal.ZERO : request.outstanding();
        LocalDate asOf = request.outstandingAsOf() == null ? LocalDate.now(clock) : request.outstandingAsOf();

        // The card's own account - a liability, opened at what's owed (negative).
        Account account = accountService.create(new CreateAccountRequest(
                request.name(), AccountType.CREDIT_CARD, blankToNull(request.institution()), request.lastFour(), null,
                MoneyScale.normalise(owed.negate()), asOf, null,
                null, null, null, null, null, null));

        cardService.createTerms(account.getId(), new CreateCreditCardTermsRequest(
                request.creditLimit(), request.statementDay(), request.dueDay(),
                request.payFromAccountId(), request.network()));

        log.info("Credit card created accountId={}", account.getId());
        return get(account.getId());
    }

    @Override
    @Transactional
    public CreditCardView update(Long accountId, UpdateCreditCardRequest request) {
        requireCard(accountId);

        if (request.name() != null || request.institution() != null || request.lastFour() != null) {
            accountService.update(accountId, new UpdateAccountRequest(
                    request.name(), request.institution(), request.lastFour(),
                    null, null, null, null, null, null, null, null, null));
        }

        boolean hasTerms = termsRepository
                .findByAccountIdAndUserIdAndDeletedAtIsNull(accountId, currentUser.currentUserId()).isPresent();
        boolean termsGiven = request.creditLimit() != null || request.statementDay() != null || request.dueDay() != null
                || request.network() != null || request.payFromAccountId() != null
                || Boolean.TRUE.equals(request.clearPayFromAccount());

        if (hasTerms) {
            if (termsGiven) {
                cardService.updateTerms(accountId, new UpdateCreditCardTermsRequest(
                        request.creditLimit(), request.statementDay(), request.dueDay(),
                        request.payFromAccountId(), request.network(), request.clearPayFromAccount()));
            }
        } else if (termsGiven) {
            // A card account added before cards had their own screen: finish setting it up.
            if (request.creditLimit() == null || request.statementDay() == null || request.dueDay() == null) {
                throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                        "Add the credit limit, statement day and due day to finish setting up this card.", "creditLimit");
            }
            cardService.createTerms(accountId, new CreateCreditCardTermsRequest(
                    request.creditLimit(), request.statementDay(), request.dueDay(),
                    request.payFromAccountId(), request.network()));
        }

        log.info("Credit card updated accountId={}", accountId);
        return get(accountId);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal remainingOn(CardStatement statement) {
        BigDecimal paid = postingRepository.sumCreditsForAccountAfter(
                statement.getAccountId(), statement.getUserId(), statement.getStatementDate());
        return MoneyScale.normalise(statement.getTotalAmount().subtract(paid).max(BigDecimal.ZERO));
    }

    private CreditCardView toView(Account account, List<Loan> loans, LocalDate today) {
        Long userId = account.getUserId();
        // Card balances are negative when owed; negate for "owed". Negative = in credit.
        BigDecimal outstanding = MoneyScale.normalise(balanceCalculator.currentBalance(account).negate());
        BigDecimal owed = outstanding.max(BigDecimal.ZERO);

        CreditCardTerms terms = termsRepository.findByAccountIdAndUserIdAndDeletedAtIsNull(account.getId(), userId).orElse(null);
        Account payFrom = terms == null || terms.getPayFromAccountId() == null
                ? null : accountService.getByIdIncludingDeleted(terms.getPayFromAccountId());

        BigDecimal available = null;
        BigDecimal utilisation = null;
        LocalDate nextStatement = null;
        LocalDate nextStatementDue = null;
        if (terms != null) {
            available = MoneyScale.normalise(terms.getCreditLimit().subtract(outstanding));
            utilisation = terms.getCreditLimit().signum() > 0
                    ? owed.divide(terms.getCreditLimit(), 4, RoundingMode.HALF_UP) : null;
            nextStatement = dueDates.nextStatementDate(today, terms.getStatementDay());
            nextStatementDue = dueDates.statementDueDate(nextStatement, terms.getDueDay());
        }

        CardStatement latest = statementRepository.findLatest(account.getId(), userId).orElse(null);
        CreditCardView.LatestStatement latestStatus = null;
        BigDecimal unbilled = null;
        if (latest != null) {
            // Entries before the card was tracked aren't in its balance - don't count them either.
            LocalDate since = latest.getStatementDate().isBefore(account.getOpeningAsOf())
                    ? account.getOpeningAsOf() : latest.getStatementDate();
            BigDecimal paidSince = MoneyScale.normalise(postingRepository.sumCreditsForAccountAfter(account.getId(), userId, since));
            BigDecimal remaining = MoneyScale.normalise(latest.getTotalAmount().subtract(paidSince).max(BigDecimal.ZERO));
            BigDecimal minimumRemaining = MoneyScale.normalise(latest.getMinimumDue().subtract(paidSince).max(BigDecimal.ZERO));
            StatementStatus status = remaining.signum() == 0 ? StatementStatus.PAID
                    : today.isAfter(latest.getDueDate()) ? StatementStatus.OVERDUE : StatementStatus.DUE;
            latestStatus = new CreditCardView.LatestStatement(latest, paidSince, remaining, minimumRemaining, status);
            unbilled = MoneyScale.normalise(postingRepository.sumDebitsForAccountAfter(account.getId(), userId, since).negate());
        }

        List<CreditCardView.CardEmi> emis = new ArrayList<>();
        BigDecimal emiTotal = BigDecimal.ZERO;
        for (Loan loan : loans) {
            if (!account.getId().equals(loan.getPayFromAccountId()) || loan.getStatus() == LoanStatus.CLOSED) {
                continue;
            }
            int elapsed = amortisationCalculator.emisElapsed(loan, today);
            int left = loan.getEmisRemaining() - elapsed;
            if (left <= 0) {
                continue;
            }
            emis.add(new CreditCardView.CardEmi(loan.getId(),
                    accountService.getByIdIncludingDeleted(loan.getAccountId()).getName(), loan.getEmi(),
                    amortisationCalculator.dueDate(loan, elapsed + 1),
                    amortisationCalculator.dueDate(loan, loan.getEmisRemaining()), left));
            emiTotal = emiTotal.add(loan.getEmi());
        }
        emis.sort(Comparator.comparing(CreditCardView.CardEmi::nextChargeDate));

        return new CreditCardView(account, terms, payFrom, outstanding, available, utilisation, unbilled,
                nextStatement, nextStatementDue, latestStatus, emis, MoneyScale.normalise(emiTotal));
    }

    private Account requireCard(Long accountId) {
        Account account = accountService.getById(accountId);
        if (account.getType() != AccountType.CREDIT_CARD) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "That account isn't a credit card.", "accountId");
        }
        return account;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
