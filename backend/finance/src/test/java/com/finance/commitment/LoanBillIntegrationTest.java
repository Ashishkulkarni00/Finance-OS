package com.finance.commitment;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.commitment.dto.CreateCommitmentRequest;
import com.finance.commitment.dto.UpdateCommitmentRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.cycle.CycleService;
import com.finance.cycle.domain.Cycle;
import com.finance.loan.AmortisationCalculator;
import com.finance.loan.LoanService;
import com.finance.loan.domain.LoanPaidVia;
import com.finance.loan.dto.CreateLoanRequest;
import com.finance.loan.dto.UpdateLoanRequest;
import com.finance.timeline.TimelineItemType;
import com.finance.timeline.TimelineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * A loan's EMI is stated once, on the loan. The plan bill that pays it follows the loan -
 * amount, day, account and last payment - and Coming up lists the EMI once, as the bill.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LoanBillIntegrationTest {

    @Autowired
    private AccountService accountService;
    @Autowired
    private LoanService loanService;
    @Autowired
    private CommitmentService commitmentService;
    @Autowired
    private CommitmentRepository commitmentRepository;
    @Autowired
    private TimelineService timelineService;
    @Autowired
    private CycleService cycleService;
    @Autowired
    private AmortisationCalculator calculator;
    @Autowired
    private Clock clock;

    private Account bank;
    private Account loanAccount;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        today = LocalDate.now(clock);
        bank = accountService.create(new CreateAccountRequest(
                "Loan Bill Test Bank", AccountType.BANK, null, null, null,
                new BigDecimal("90000.00"), today.minusMonths(1), null, null, null, null, null, null, null));
        loanAccount = accountService.create(new CreateAccountRequest(
                "Loan Bill Test Bike loan", AccountType.LOAN, null, null, null,
                new BigDecimal("-30000.00"), today.minusDays(1), null, null, null, null, null, null, null));
    }

    private Long loan(Long payFrom, int emiDay) {
        return loanService.create(new CreateLoanRequest(
                loanAccount.getId(), "Test Bank", new BigDecimal("30000.00"), today.minusDays(1), 5, null,
                new BigDecimal("6145.00"), emiDay, null, null, null, null, null,
                LoanPaidVia.BANK, null, null, payFrom, null, null)).loan().getId();
    }

    private static UpdateLoanRequest loanEdit(BigDecimal emi, Long payFrom) {
        return new UpdateLoanRequest(null, null, null, null, null, null, null, null, null,
                null, null, emi, null, null, null, null, payFrom, null, null, null);
    }

    @Test
    @DisplayName("a bill made from a loan carries the loan's EMI, day, account and last payment, and is made once")
    void billFollowsLoan() {
        Long loanId = loan(bank.getId(), 5);

        Commitment bill = commitmentService.createFromLoan(loanId).commitment();

        assertThat(bill.getSourceType()).isEqualTo(CommitmentSource.LOAN);
        assertThat(bill.getSourceId()).isEqualTo(loanId);
        assertThat(bill.getFixedAmount()).isEqualByComparingTo("6145.00");
        assertThat(bill.getDueDay()).isEqualTo(5);
        assertThat(bill.getAccountId()).isEqualTo(bank.getId());
        LocalDate lastEmi = calculator.dueDate(loanService.getById(loanId).loan(), 5);
        assertThat(bill.getActiveTo()).isEqualTo(lastEmi);
        assertThat(bill.isMandatory()).isTrue();

        // Asking again returns the same bill rather than a second copy.
        assertThat(commitmentService.createFromLoan(loanId).commitment().getId()).isEqualTo(bill.getId());
        assertThat(loanService.getById(loanId).planCommitmentId()).isEqualTo(bill.getId());
    }

    @Test
    @DisplayName("changing the loan's EMI changes the bill; the bill's own edits can't override the loan's figures")
    void loanChangesReachTheBill() {
        Long loanId = loan(bank.getId(), 5);
        Long billId = commitmentService.createFromLoan(loanId).commitment().getId();

        loanService.update(loanId, loanEdit(new BigDecimal("6200.00"), null));
        assertThat(commitmentRepository.findById(billId).orElseThrow().getFixedAmount()).isEqualByComparingTo("6200.00");

        commitmentService.update(billId, new UpdateCommitmentRequest("Bike EMI", null, new BigDecimal("1.00"), null, null,
                null, null, null, null, null, null, null, null, null, null, null, null, null));
        Commitment bill = commitmentRepository.findById(billId).orElseThrow();
        assertThat(bill.getName()).isEqualTo("Bike EMI");
        assertThat(bill.getFixedAmount()).isEqualByComparingTo("6200.00");
    }

    @Test
    @DisplayName("a loan with no paying account can't be put in the plan yet")
    void needsPayFrom() {
        Long loanId = loan(null, 5);
        assertThatThrownBy(() -> commitmentService.createFromLoan(loanId)).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    @DisplayName("an existing hand-typed EMI bill can be linked to its loan, once; unlinking keeps its figures")
    void linkExistingBill() {
        Cycle cycle = cycleService.resolveCurrent();
        Long loanId = loan(bank.getId(), 5);
        Long manual = commitmentService.create(new CreateCommitmentRequest(
                "Bike EMI", CommitmentAmountType.FIXED, new BigDecimal("6000.00"), CommitmentFrequency.MONTHLY,
                7, bank.getId(), null, true, false, cycle.getStartDate(), null, null, null)).commitment().getId();

        commitmentService.update(manual, link(loanId));
        Commitment linked = commitmentRepository.findById(manual).orElseThrow();
        assertThat(linked.getFixedAmount()).isEqualByComparingTo("6145.00");
        assertThat(linked.getDueDay()).isEqualTo(5);
        // Its start - and so its history - is its own.
        assertThat(linked.getActiveFrom()).isEqualTo(cycle.getStartDate());

        Long another = commitmentService.create(new CreateCommitmentRequest(
                "Bike EMI again", CommitmentAmountType.FIXED, new BigDecimal("6145.00"), CommitmentFrequency.MONTHLY,
                5, bank.getId(), null, true, false, cycle.getStartDate(), null, null, null)).commitment().getId();
        assertThatThrownBy(() -> commitmentService.update(another, link(loanId)))
                .isInstanceOf(BusinessRuleException.class);

        commitmentService.update(manual, new UpdateCommitmentRequest(null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, true));
        Commitment unlinked = commitmentRepository.findById(manual).orElseThrow();
        assertThat(unlinked.getSourceType()).isEqualTo(CommitmentSource.MANUAL);
        assertThat(unlinked.getFixedAmount()).isEqualByComparingTo("6145.00");
    }

    @Test
    @DisplayName("Coming up lists a loan's EMI once - as the bill - after the loan is in the plan")
    void timelineListsEmiOnce() {
        Long loanId = loan(bank.getId(), today.plusDays(3).getDayOfMonth() > 28 ? 1 : today.plusDays(3).getDayOfMonth());
        assertThat(timelineService.upcoming(40)).anyMatch(i -> i.type() == TimelineItemType.LOAN_EMI && i.sourceId().equals(loanId));

        commitmentService.createFromLoan(loanId);

        assertThat(timelineService.upcoming(40)).noneMatch(i -> i.type() == TimelineItemType.LOAN_EMI && i.sourceId().equals(loanId));
    }

    @Test
    @DisplayName("deleting the loan ends its bill")
    void deletingLoanEndsBill() {
        Long loanId = loan(bank.getId(), 5);
        Long billId = commitmentService.createFromLoan(loanId).commitment().getId();

        loanService.delete(loanId);

        // Ended: either its last payment is today at the latest, or (for a loan whose first
        // EMI hadn't come yet) the bill's window closes before it opens - no more EMIs.
        Commitment bill = commitmentRepository.findById(billId).orElseThrow();
        assertThat(!bill.getActiveTo().isAfter(today) || bill.getActiveTo().isBefore(bill.getActiveFrom()))
                .as("bill generates no further occurrences").isTrue();    }

    private static UpdateCommitmentRequest link(Long loanId) {
        return new UpdateCommitmentRequest(null, null, null, null, null, null, null, null, null, null, null, null, null,
                null, null, CommitmentSource.LOAN, loanId, null);
    }
}
