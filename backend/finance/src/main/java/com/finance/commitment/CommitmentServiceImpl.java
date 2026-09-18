package com.finance.commitment;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.category.CategoryService;
import com.finance.category.domain.Category;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.account.domain.AccountType;
import com.finance.investment.InvestmentRepository;
import com.finance.investment.domain.Investment;
import com.finance.loan.LoanRepository;
import com.finance.transaction.domain.TransactionType;
import com.finance.loan.domain.Loan;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.dto.CreateCommitmentRequest;
import com.finance.commitment.dto.UpdateCommitmentRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.CycleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Business rules for commitment rules - see {@code CommitmentInstanceServiceImpl} for occurrences. */
@Service
public class CommitmentServiceImpl implements CommitmentService {

    private static final Logger log = LoggerFactory.getLogger(CommitmentServiceImpl.class);

    private final CommitmentRepository repository;
    private final CommitmentMapper mapper;
    private final AccountService accountService;
    private final CategoryService categoryService;
    private final CurrentUserProvider currentUser;
    private final CommitmentInstanceService instanceService;
    private final CycleService cycleService;
    private final LoanRepository loanRepository;
    private final LoanBillSync loanBillSync;
    private final SourceBillSync sourceBillSync;
    private final InvestmentRepository investmentRepository;

    public CommitmentServiceImpl(CommitmentRepository repository,
                                 CommitmentMapper mapper,
                                 AccountService accountService,
                                 CategoryService categoryService,
                                 CurrentUserProvider currentUser,
                                 CommitmentInstanceService instanceService,
                                 CycleService cycleService,
                                 LoanRepository loanRepository,
                                 LoanBillSync loanBillSync,
                                 SourceBillSync sourceBillSync,
                                 InvestmentRepository investmentRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.accountService = accountService;
        this.categoryService = categoryService;
        this.currentUser = currentUser;
        this.instanceService = instanceService;
        this.cycleService = cycleService;
        this.loanRepository = loanRepository;
        this.loanBillSync = loanBillSync;
        this.sourceBillSync = sourceBillSync;
        this.investmentRepository = investmentRepository;
    }

    /**
     * Brings the current cycle's occurrences in line with the rules, as part of the same
     * write that changed a rule.
     *
     * <p>Occurrences used to be generated only when {@code GET /cycles/{id}/commitment-
     * instances} happened to be read. {@code GET /position} reads occurrences directly and
     * never generates them - so after adding a bill, whichever of the two requests the
     * screen fired first decided whether "free for the rest of this cycle" included it.
     * Doing it here makes the rule and its occurrence one fact. {@code listForCycle} is
     * idempotent, and also retires any untouched occurrence a change has made invalid.
     *
     * <p>No cycle between beans: nothing depends on {@code CommitmentService} except its
     * controller, and {@code CommitmentInstanceServiceImpl} reads rules through the
     * repository, not through this service.
     */
    @Override
    @Transactional
    public CommitmentView createFromLoan(Long loanId) {
        Long userId = currentUser.currentUserId();
        Loan loan = requireLoan(loanId);
        List<Commitment> existing = repository.findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(
                CommitmentSource.LOAN, loanId, userId);
        if (!existing.isEmpty()) {
            return resolveView(existing.getFirst());
        }
        String lender = loan.getLender() == null || loan.getLender().isBlank()
                ? accountService.getByIdIncludingDeleted(loan.getAccountId()).getName() : loan.getLender();
        Commitment bill = Commitment.builder()
                .userId(userId)
                .name(truncate(lender + " EMI"))
                .mandatory(true)
                .sourceType(CommitmentSource.LOAN)
                .sourceId(loanId)
                .activeFrom(loanBillSync.firstDueDate(loan))
                .why("Loan repayment")
                .ifSkipped("Late fee, penal interest and a mark on your credit score")
                .build();
        loanBillSync.apply(bill, loan);
        Commitment saved = repository.save(bill);
        log.info("Commitment created from loan id={} loanId={}", saved.getId(), loanId);
        syncCurrentCycle();
        return resolveView(saved);
    }

    @Override
    @Transactional
    public CommitmentView createFromInvestment(Long investmentId) {
        Long userId = currentUser.currentUserId();
        sourceBillSync.requireLinkable(CommitmentSource.INVESTMENT, investmentId, userId);
        List<Commitment> existing = repository.findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(
                CommitmentSource.INVESTMENT, investmentId, userId);
        if (!existing.isEmpty()) {
            return resolveView(existing.getFirst());
        }
        Investment investment = investmentRepository.findById(investmentId).orElseThrow();
        Commitment bill = Commitment.builder()
                .userId(userId)
                .name(truncate(investment.getName() + " instalment"))
                .mandatory(true)
                .sourceType(CommitmentSource.INVESTMENT)
                .sourceId(investmentId)
                .dueDay(1)
                .activeFrom(cycleService.resolveCurrent().getStartDate())
                .why("Money put to work every month")
                .build();
        sourceBillSync.apply(bill);
        requireValidSettlement(bill);
        Commitment saved = repository.save(bill);
        log.info("Commitment created from investment id={} investmentId={}", saved.getId(), investmentId);
        syncCurrentCycle();
        return resolveView(saved);
    }

    @Override
    @Transactional
    public void syncSourceBills(CommitmentSource sourceType, Long sourceId) {
        List<Commitment> bills = repository.findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(
                sourceType, sourceId, currentUser.currentUserId());
        if (bills.isEmpty()) {
            return;
        }
        for (Commitment bill : bills) {
            sourceBillSync.apply(bill);
            repository.save(bill);
            log.info("Commitment synced from source id={} sourceType={} sourceId={}", bill.getId(), sourceType, sourceId);
        }
        syncCurrentCycle();
    }

    private static Commitment copyStartingOn(Commitment rule, java.time.LocalDate start) {
        return Commitment.builder()
                .userId(rule.getUserId())
                .name(rule.getName())
                .amountType(rule.getAmountType())
                .fixedAmount(rule.getFixedAmount())
                .frequency(rule.getFrequency())
                .dueDay(rule.getDueDay())
                .accountId(rule.getAccountId())
                .toAccountId(rule.getToAccountId())
                .categoryId(rule.getCategoryId())
                .mandatory(rule.isMandatory())
                .why(rule.getWhy())
                .ifSkipped(rule.getIfSkipped())
                .sourceType(rule.getSourceType())
                .sourceId(rule.getSourceId())
                .settleAs(rule.getSettleAs())
                .requiresVerification(rule.isRequiresVerification())
                .activeFrom(start)
                .activeTo(rule.getActiveTo())
                .build();
    }

    /** One bill per loan or holding - a second would pay the same instalment twice.
     *  A goal can be funded from more than one bill (two accounts contributing). */
    private void requireSourceFree(Commitment bill) {
        if (bill.getSourceType() == CommitmentSource.GOAL || bill.getSourceType() == CommitmentSource.MANUAL) {
            return;
        }
        boolean takenByAnother = repository.findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(
                        bill.getSourceType(), bill.getSourceId(), bill.getUserId()).stream()
                .anyMatch(other -> !other.getId().equals(bill.getId()));
        if (takenByAnother) {
            throw new BusinessRuleException(ErrorCode.SOURCE_ALREADY_LINKED,
                    bill.getSourceType() == CommitmentSource.LOAN
                            ? "Another bill already pays this loan's EMI."
                            : "Another bill already pays this holding's instalment.",
                    "sourceId");
        }
    }

    /**
     * How a bill is paid has to be possible: a transfer or investment needs somewhere for
     * the money to go (and not back into the paying account), income arrives in a bank or
     * cash account, and an expense or income has no destination. Mirrors
     * {@code TransactionType.acceptsSource/acceptsDestination}, because settling creates
     * exactly that kind of entry.
     */
    private void requireValidSettlement(Commitment bill) {
        TransactionType type = bill.getSettleAs();
        if (!type.requiresDestination()) {
            bill.setToAccountId(null);
        }
        Account from = accountService.getByIdIncludingDeleted(bill.getAccountId());
        if (type != TransactionType.EXPENSE && !type.acceptsSource(from.getType())) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "%s can't pay a bill like this - choose a bank or cash account.".formatted(from.getName()), "accountId");
        }
        if (!type.requiresDestination()) {
            return;
        }
        if (bill.getToAccountId() == null) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "Which account does the money go to?", "toAccountId");
        }
        if (bill.getToAccountId().equals(bill.getAccountId())) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "The money would go back into the account it leaves.", "toAccountId");
        }
        Account to = accountService.getById(bill.getToAccountId());
        if (!type.acceptsDestination(to.getType())) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    type == TransactionType.INVESTMENT
                            ? "An investment goes into an investment account."
                            : "%s can't receive this transfer.".formatted(to.getName()),
                    "toAccountId");
        }
    }

    @Override
    @Transactional
    public void syncLoanBills(Long loanId) {
        Long userId = currentUser.currentUserId();
        List<Commitment> bills = repository.findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(
                CommitmentSource.LOAN, loanId, userId);
        if (bills.isEmpty()) {
            return;
        }
        // Read including a deleted loan: deleting the loan ends its bill rather than orphaning it.
        Loan loan = loanRepository.findById(loanId).filter(l -> l.getUserId().equals(userId)).orElse(null);
        for (Commitment bill : bills) {
            if (loan == null) {
                continue;
            }
            loanBillSync.apply(bill, loan);
            repository.save(bill);
            log.info("Commitment synced from loan id={} loanId={}", bill.getId(), loanId);
        }
        syncCurrentCycle();
    }

    private Loan requireLoan(Long loanId) {
        return loanRepository.findByIdAndUserIdAndDeletedAtIsNull(loanId, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "We couldn't find that loan."));
    }

    private static String truncate(String name) {
        return name.length() <= 100 ? name : name.substring(0, 100);
    }

    private void syncCurrentCycle() {
        instanceService.listForCycle(cycleService.resolveCurrent().getId());
    }

    @Override
    @Transactional
    public CommitmentView create(CreateCommitmentRequest request) {
        Long userId = currentUser.currentUserId();
        requireConsistentAmount(request.amountType(), request.fixedAmount());

        Account account = accountService.getById(request.accountId());
        Category category = request.categoryId() == null ? null : categoryService.getById(request.categoryId());

        Commitment bill = mapper.toEntity(request, userId);
        if (bill.getSourceType() != CommitmentSource.MANUAL) {
            sourceBillSync.requireLinkable(bill.getSourceType(), bill.getSourceId(), userId);
            requireSourceFree(bill);
            sourceBillSync.apply(bill);
        }
        requireValidSettlement(bill);
        Commitment saved = repository.save(bill);
        log.info("Commitment created id={}", saved.getId());
        syncCurrentCycle();
        // Re-read: a bill that follows a loan or holding may leave a different account.
        return resolveView(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CommitmentView getById(Long id) {
        Commitment commitment = requireOwned(id);
        return resolveView(commitment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommitmentView> list(boolean includeArchived, Pageable pageable) {
        return repository.findAllForUser(currentUser.currentUserId(), includeArchived, pageable)
                .map(this::resolveView);
    }

    @Override
    @Transactional
    public CommitmentView update(Long id, UpdateCommitmentRequest request) {
        Commitment current = requireOwned(id);
        Commitment commitment = current;
        if (request.applyFrom() != null && request.applyFrom().isAfter(current.getActiveFrom())) {
            if (current.getSourceType() == CommitmentSource.LOAN || current.getSourceType() == CommitmentSource.INVESTMENT) {
                throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                        "This bill follows its loan or holding - change it there, or set when it stops.", "applyFrom");
            }
            if (current.getActiveTo() != null && request.applyFrom().isAfter(current.getActiveTo())) {
                throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                        "The bill has already ended by then.", "applyFrom");
            }
            // Months before applyFrom keep the bill exactly as it was; the changes go on a
            // copy that starts then. Two rules, one ended - no history rewritten.
            commitment = copyStartingOn(current, request.applyFrom());
            current.setActiveTo(request.applyFrom().minusDays(1));
            repository.save(current);
            log.info("Commitment split id={} from={}", current.getId(), request.applyFrom());
        }

        if (request.name() != null) {
            String name = request.name().trim();
            if (name.isEmpty()) {
                throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                        "A commitment needs a name you'll recognise.", "name");
            }
            commitment.setName(name);
        }
        if (request.amountType() != null) {
            commitment.setAmountType(request.amountType());
            // Switching to "varies" drops the old fixed figure - otherwise the switch could
            // never pass requireConsistentAmount, since null here means "unchanged".
            if (request.amountType() == CommitmentAmountType.VARIABLE) {
                commitment.setFixedAmount(null);
            }
        }
        if (request.fixedAmount() != null) {
            commitment.setFixedAmount(request.fixedAmount());
        }
        requireConsistentAmount(commitment.getAmountType(), commitment.getFixedAmount());

        if (request.frequency() != null) {
            commitment.setFrequency(request.frequency());
        }
        if (request.dueDay() != null) {
            commitment.setDueDay(request.dueDay());
        }
        if (request.accountId() != null) {
            // Ownership-checked, as on create: another user's account is a 404.
            accountService.getById(request.accountId());
            commitment.setAccountId(request.accountId());
        }
        if (Boolean.TRUE.equals(request.clearCategory())) {
            commitment.setCategoryId(null);
        } else if (request.categoryId() != null) {
            categoryService.getById(request.categoryId());
            commitment.setCategoryId(request.categoryId());
        }
        if (request.mandatory() != null) {
            commitment.setMandatory(request.mandatory());
        }
        if (request.requiresVerification() != null) {
            commitment.setRequiresVerification(request.requiresVerification());
        }
        if (request.activeFrom() != null) {
            commitment.setActiveFrom(request.activeFrom());
        }
        if (Boolean.TRUE.equals(request.clearActiveTo())) {
            commitment.setActiveTo(null);
        } else if (request.activeTo() != null) {
            commitment.setActiveTo(request.activeTo());
        }
        if (Boolean.TRUE.equals(request.clearSource())) {
            commitment.setSourceType(CommitmentSource.MANUAL);
            commitment.setSourceId(null);
        } else if (request.sourceType() != null && request.sourceType() != CommitmentSource.MANUAL) {
            if (request.sourceId() == null) {
                throw new BusinessRuleException(ErrorCode.SOURCE_NOT_SUPPORTED,
                        "Say which one this bill follows.", "sourceId");
            }
            sourceBillSync.requireLinkable(request.sourceType(), request.sourceId(), commitment.getUserId());
            commitment.setSourceType(request.sourceType());
            commitment.setSourceId(request.sourceId());
            requireSourceFree(commitment);
        }
        if (request.settleAs() != null) {
            commitment.setSettleAs(request.settleAs());
        }
        if (request.toAccountId() != null) {
            commitment.setToAccountId(request.toAccountId());
        }
        // A linked bill's figures are its source's, whatever this request said about them.
        // A deleted source still applies (it has already ended the bill), so renaming works.
        boolean followsLoan = commitment.getSourceType() == CommitmentSource.LOAN;
        sourceBillSync.apply(commitment);
        requireValidSettlement(commitment);

        if (!followsLoan && commitment.getActiveTo() != null && commitment.getActiveTo().isBefore(commitment.getActiveFrom())) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "The last payment can't be before the bill starts.", "activeTo");
        }
        if (request.why() != null) {
            commitment.setWhy(request.why().isBlank() ? null : request.why().trim());
        }
        if (request.ifSkipped() != null) {
            commitment.setIfSkipped(request.ifSkipped().isBlank() ? null : request.ifSkipped().trim());
        }

        Commitment saved = repository.save(commitment);
        log.info("Commitment updated id={}", saved.getId());
        syncCurrentCycle();
        return resolveView(saved);
    }

    @Override
    @Transactional
    public CommitmentView archive(Long id) {
        Commitment commitment = requireOwned(id);
        if (!commitment.isArchived()) {
            commitment.archive();
            repository.save(commitment);
            log.info("Commitment archived id={}", id);
        }
        return resolveView(commitment);
    }

    @Override
    @Transactional
    public CommitmentView unarchive(Long id) {
        Commitment commitment = requireOwned(id);
        if (commitment.isArchived()) {
            commitment.unarchive();
            repository.save(commitment);
            log.info("Commitment unarchived id={}", id);
        }
        return resolveView(commitment);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Commitment commitment = requireOwned(id);
        commitment.markDeleted();
        repository.save(commitment);
        log.info("Commitment soft-deleted id={}", id);
        syncCurrentCycle();
    }

    private CommitmentView resolveView(Commitment commitment) {
        Account account = accountService.getByIdIncludingDeleted(commitment.getAccountId());
        Category category = commitment.getCategoryId() == null
                ? null : categoryService.getByIdIncludingDeleted(commitment.getCategoryId());
        return new CommitmentView(commitment, account, category);
    }

    private Commitment requireOwned(Long id) {
        return repository.findByIdAndUserIdAndDeletedAtIsNull(id, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.COMMITMENT_NOT_FOUND,
                        "We couldn't find that commitment. It may have been deleted."));
    }

    private void requireConsistentAmount(CommitmentAmountType type, java.math.BigDecimal fixedAmount) {
        if (type == CommitmentAmountType.FIXED && fixedAmount == null) {
            throw new BusinessRuleException(ErrorCode.FIXED_AMOUNT_REQUIRED,
                    "A fixed commitment needs its amount.", "fixedAmount");
        }
        if (type == CommitmentAmountType.VARIABLE && fixedAmount != null) {
            throw new BusinessRuleException(ErrorCode.FIXED_AMOUNT_NOT_ALLOWED,
                    "A variable commitment's amount isn't known up front - leave this blank.", "fixedAmount");
        }
    }
}
