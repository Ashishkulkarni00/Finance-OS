package com.finance.card;

import com.finance.account.AccountBalanceCalculator;
import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.card.domain.CardStatement;
import com.finance.card.domain.CreditCardTerms;
import com.finance.card.dto.CreateCardStatementRequest;
import com.finance.card.dto.CreateCreditCardTermsRequest;
import com.finance.card.dto.UpdateCreditCardTermsRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.transaction.PostingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Business rules for credit cards. Statement figures are typed in and authoritative;
 * outstanding/unbilled/available credit are always derived, never stored (ADR-0011).
 */
@Service
public class CardServiceImpl implements CardService {

    private static final Logger log = LoggerFactory.getLogger(CardServiceImpl.class);

    private final CreditCardTermsRepository termsRepository;
    private final CardStatementRepository statementRepository;
    private final PostingRepository postingRepository;
    private final AccountService accountService;
    private final AccountBalanceCalculator balanceCalculator;
    private final CardDueDateCalculator dueDates;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public CardServiceImpl(CreditCardTermsRepository termsRepository,
                           CardStatementRepository statementRepository,
                           PostingRepository postingRepository,
                           AccountService accountService,
                           AccountBalanceCalculator balanceCalculator,
                           CardDueDateCalculator dueDates,
                           CurrentUserProvider currentUser,
                           Clock clock) {
        this.termsRepository = termsRepository;
        this.statementRepository = statementRepository;
        this.postingRepository = postingRepository;
        this.accountService = accountService;
        this.balanceCalculator = balanceCalculator;
        this.dueDates = dueDates;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Override
    @Transactional
    public CreditCardTermsView createTerms(Long accountId, CreateCreditCardTermsRequest request) {
        Long userId = currentUser.currentUserId();
        Account account = requireCardAccount(accountId);
        if (termsRepository.findByAccountIdAndUserIdAndDeletedAtIsNull(accountId, userId).isPresent()) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "This card already has terms set. Update them instead.", "accountId");
        }
        requirePayFromAccount(request.payFromAccountId());

        CreditCardTerms terms = CreditCardTerms.builder()
                .userId(userId)
                .accountId(accountId)
                .creditLimit(MoneyScale.normalise(request.creditLimit()))
                .statementDay(request.statementDay())
                .dueDay(request.dueDay())
                .network(request.network())
                .payFromAccountId(request.payFromAccountId())
                .build();

        CreditCardTerms saved = termsRepository.save(terms);
        log.info("Credit card terms created accountId={}", accountId);
        return toView(saved, account);
    }

    @Override
    @Transactional(readOnly = true)
    public CreditCardTermsView getTerms(Long accountId) {
        Account account = requireCardAccount(accountId);
        CreditCardTerms terms = requireTerms(accountId);
        return toView(terms, account);
    }

    @Override
    @Transactional
    public CreditCardTermsView updateTerms(Long accountId, UpdateCreditCardTermsRequest request) {
        Account account = requireCardAccount(accountId);
        CreditCardTerms terms = requireTerms(accountId);

        if (request.creditLimit() != null) {
            terms.setCreditLimit(MoneyScale.normalise(request.creditLimit()));
        }
        if (request.statementDay() != null) {
            terms.setStatementDay(request.statementDay());
        }
        if (request.dueDay() != null) {
            terms.setDueDay(request.dueDay());
        }
        if (request.network() != null) {
            terms.setNetwork(request.network());
        }
        if (Boolean.TRUE.equals(request.clearPayFromAccount())) {
            terms.setPayFromAccountId(null);
        } else if (request.payFromAccountId() != null) {
            requirePayFromAccount(request.payFromAccountId());
            terms.setPayFromAccountId(request.payFromAccountId());
        }

        CreditCardTerms saved = termsRepository.save(terms);
        log.info("Credit card terms updated accountId={}", accountId);
        return toView(saved, account);
    }

    @Override
    @Transactional
    public CardStatement addStatement(Long accountId, CreateCardStatementRequest request) {
        requireCardAccount(accountId);
        Long userId = currentUser.currentUserId();

        if (request.statementDate().isAfter(LocalDate.now(clock))) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "That statement date hasn't happened yet.", "statementDate");
        }
        if (request.dueDate().isBefore(request.statementDate())) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "The due date can't be before the statement date.", "dueDate");
        }
        if (request.minimumDue().compareTo(request.totalAmount()) > 0) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "The minimum due can't be more than the total.", "minimumDue");
        }
        if (statementRepository.existsByAccountIdAndUserIdAndStatementDate(accountId, userId, request.statementDate())) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "A statement for that date is already recorded. Delete it first to enter it again.", "statementDate");
        }

        CardStatement statement = CardStatement.builder()
                .userId(userId)
                .accountId(accountId)
                .statementDate(request.statementDate())
                .dueDate(request.dueDate())
                .totalAmount(MoneyScale.normalise(request.totalAmount()))
                .minimumDue(MoneyScale.normalise(request.minimumDue()))
                .enteredAt(Instant.now())
                .build();

        CardStatement saved = statementRepository.save(statement);
        log.info("Card statement added accountId={} statementDate={}", accountId, request.statementDate());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CardStatement> listStatements(Long accountId) {
        requireCardAccount(accountId);
        return statementRepository.findByAccountIdAndUserIdOrderByStatementDateDesc(accountId, currentUser.currentUserId());
    }

    @Override
    @Transactional
    public void deleteStatement(Long accountId, Long statementId) {
        requireCardAccount(accountId);
        CardStatement statement = statementRepository
                .findByIdAndAccountIdAndUserId(statementId, accountId, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "That statement doesn't exist."));
        statement.markDeleted();
        statementRepository.save(statement);
        log.info("Card statement withdrawn id={} accountId={}", statementId, accountId);
    }

    /**
     * What the statement should say, worked out from the card's own entries: the card's
     * balance at the end of the statement date. The bank's figure wins if they differ -
     * a difference means an entry is missing from the Ledger.
     */
    @Override
    @Transactional(readOnly = true)
    public StatementDraft statementDraft(Long accountId, LocalDate statementDate) {
        Account account = requireCardAccount(accountId);
        CreditCardTerms terms = requireTerms(accountId);
        LocalDate today = LocalDate.now(clock);

        LocalDate date = statementDate != null ? statementDate : dueDates.latestStatementDate(today, terms.getStatementDay());
        LocalDate dueDate = dueDates.statementDueDate(date, terms.getDueDay());

        BigDecimal total = null;
        // Before the card was tracked there are no entries to add up - say so, don't guess.
        if (!date.isBefore(account.getOpeningAsOf())) {
            BigDecimal balance = account.getOpeningBalance().add(postingRepository.sumPostingsForAccountBetween(
                    accountId, account.getUserId(), account.getOpeningAsOf(), date));
            total = MoneyScale.normalise(balance.negate().max(BigDecimal.ZERO));
        }

        boolean recorded = statementRepository.existsByAccountIdAndUserIdAndStatementDate(accountId, account.getUserId(), date);
        return new StatementDraft(date, dueDate, total, recorded);
    }

    private CreditCardTermsView toView(CreditCardTerms terms, Account account) {
        BigDecimal balance = balanceCalculator.currentBalance(account);
        // Card balances are negative when money is owed - negate for a positive "owed" figure.
        BigDecimal outstanding = MoneyScale.normalise(balance.negate());
        BigDecimal availableCredit = MoneyScale.normalise(terms.getCreditLimit().subtract(outstanding));

        Optional<CardStatement> latest = statementRepository.findLatest(terms.getAccountId(), terms.getUserId());
        BigDecimal unbilled;
        if (latest.isPresent()) {
            BigDecimal spentSince = postingRepository.sumDebitsForAccountAfter(
                    terms.getAccountId(), terms.getUserId(), latest.get().getStatementDate());
            unbilled = MoneyScale.normalise(spentSince.negate());
        } else {
            unbilled = outstanding;
        }
        return new CreditCardTermsView(terms, outstanding, unbilled, availableCredit);
    }

    Account requireCardAccount(Long accountId) {
        Account account = accountService.getById(accountId);
        if (account.getType() != AccountType.CREDIT_CARD) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "That account isn't a credit card.", "accountId");
        }
        return account;
    }

    /** A card's bill is paid with money that's yours to move - a bank account or cash. */
    private void requirePayFromAccount(Long payFromAccountId) {
        if (payFromAccountId == null) {
            return;
        }
        Account payFrom = accountService.getById(payFromAccountId);
        if (payFrom.getType() != AccountType.BANK && payFrom.getType() != AccountType.CASH) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "A card bill is paid from a bank account or cash.", "payFromAccountId");
        }
    }

    private CreditCardTerms requireTerms(Long accountId) {
        return termsRepository.findByAccountIdAndUserIdAndDeletedAtIsNull(accountId, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "This card doesn't have its terms set yet."));
    }
}
