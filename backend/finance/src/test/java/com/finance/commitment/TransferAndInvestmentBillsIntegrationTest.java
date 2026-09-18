package com.finance.commitment;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.category.CategoryService;
import com.finance.category.domain.CategoryGroup;
import com.finance.category.dto.CreateCategoryRequest;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.commitment.dto.CreateCommitmentRequest;
import com.finance.commitment.dto.SettleCommitmentInstanceRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.cycle.CycleService;
import com.finance.cycle.domain.Cycle;
import com.finance.goal.GoalService;
import com.finance.goal.dto.CreateGoalRequest;
import com.finance.investment.InvestmentService;
import com.finance.investment.domain.InvestmentType;
import com.finance.investment.dto.CreateInvestmentRequest;
import com.finance.position.PositionResult;
import com.finance.position.PositionService;
import com.finance.transaction.TransactionService;
import com.finance.transaction.domain.TransactionType;
import com.finance.transaction.dto.CreateTransactionRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * A monthly transfer to savings and a SIP instalment are bills too - paid with a transfer
 * and an investment, not an expense (FIX_BACKLOG 1.1). Until paid they're spoken-for money;
 * once the matching entry is recorded they're settled, and the money is counted once.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TransferAndInvestmentBillsIntegrationTest {

    @Autowired
    private AccountService accountService;
    @Autowired
    private CommitmentService commitmentService;
    @Autowired
    private CommitmentInstanceService instanceService;
    @Autowired
    private CycleService cycleService;
    @Autowired
    private PositionService positionService;
    @Autowired
    private TransactionService transactionService;
    @Autowired
    private GoalService goalService;
    @Autowired
    private InvestmentService investmentService;
    @Autowired
    private CategoryService categoryService;

    private Cycle cycle;
    private int dueDay;
    private LocalDate dueDate;
    private Account salary;

    @BeforeEach
    void setUp() {
        cycle = cycleService.resolveCurrent();
        dueDay = cycle.getStartDate().getDayOfMonth();
        assumeTrue(dueDay <= 28, "cycle starts after the 28th");
        dueDate = cycle.getStartDate();
        salary = account("Transfer Test Salary", AccountType.BANK, true);
        instanceService.listForCycle(cycle.getId());
    }

    private Account account(String name, AccountType type, boolean spendable) {
        return accountService.create(new CreateAccountRequest(
                name, type, null, null, null, new BigDecimal(type == AccountType.BANK ? "80000.00" : "0.00"),
                cycle.getStartDate().minusMonths(1), null, null, null, spendable, null, null, null));
    }

    private CommitmentInstance occurrenceOf(Long commitmentId) {
        return instanceService.listForCycle(cycle.getId()).stream()
                .map(CommitmentInstanceView::instance)
                .filter(i -> i.getCommitmentId().equals(commitmentId))
                .findFirst().orElseThrow();
    }

    private PositionResult position() {
        PositionResult result = positionService.currentPosition();
        assumeTrue(result.complete(), "another bill in the test database has no amount");
        return result;
    }

    private Long record(TransactionType type, Long from, Long to, String amount) {
        return transactionService.create(new CreateTransactionRequest(
                dueDate, "Test movement", type, new BigDecimal(amount), from, to,
                type == TransactionType.EXPENSE ? spendingCategory() : null, null, null), null)
                .transaction().getId();
    }

    private Long spendingCategory() {
        return categoryService.create(new CreateCategoryRequest("Transfer Test Spending", CategoryGroup.FLEXIBLE, null, null)).getId();
    }

    @Test
    @DisplayName("a goal's monthly transfer is spoken-for until the transfer is recorded, then settled - counted once")
    void goalTransferSettlesWithTransfer() {
        Account savings = account("Transfer Test Emergency", AccountType.BANK, false);
        Long goalId = goalService.create(new CreateGoalRequest(
                "Emergency fund", new BigDecimal("200000.00"), LocalDate.now().plusYears(2), null, null, savings.getId()))
                .goal().getId();
        PositionResult before = position();

        Commitment bill = commitmentService.create(new CreateCommitmentRequest(
                "Emergency fund contribution", CommitmentAmountType.FIXED, new BigDecimal("10000.00"),
                CommitmentFrequency.MONTHLY, dueDay, salary.getId(), null, true, false, cycle.getStartDate(), null,
                null, null, null, null, CommitmentSource.GOAL, goalId)).commitment();
        assertThat(bill.getSettleAs()).isEqualTo(TransactionType.TRANSFER);
        assertThat(bill.getToAccountId()).isEqualTo(savings.getId());

        PositionResult planned = position();
        assertThat(planned.committed().subtract(before.committed())).isEqualByComparingTo("10000.00");

        record(TransactionType.TRANSFER, salary.getId(), savings.getId(), "10000.00");

        assertThat(occurrenceOf(bill.getId()).getStatus()).isEqualTo(CommitmentInstanceStatus.PAID);
        PositionResult paid = position();
        // Held fell by the transfer and committed fell by the bill: what's free didn't move twice.
        assertThat(paid.committed()).isEqualByComparingTo(before.committed());
        assertThat(paid.realBalance()).isEqualByComparingTo(planned.realBalance());
    }

    @Test
    @DisplayName("moving money between two spendable accounts isn't spoken-for money")
    void transferBetweenSpendableAccountsIsNotCommitted() {
        Account wallet = account("Transfer Test Wallet", AccountType.CASH, true);
        PositionResult before = position();

        commitmentService.create(new CreateCommitmentRequest(
                "Cash for the week", CommitmentAmountType.FIXED, new BigDecimal("3000.00"),
                CommitmentFrequency.MONTHLY, dueDay, salary.getId(), null, true, false, cycle.getStartDate(), null,
                null, null, TransactionType.TRANSFER, wallet.getId(), null, null));

        assertThat(position().committed()).isEqualByComparingTo(before.committed());
    }

    @Test
    @DisplayName("a SIP bill follows its holding, is settled by the investment and not by an expense of the same amount")
    void sipSettlesWithInvestment() {
        Account zerodha = account("Transfer Test Zerodha", AccountType.INVESTMENT, false);
        Long sipId = investmentService.create(new CreateInvestmentRequest(
                "Index fund SIP", InvestmentType.MUTUAL_FUND_SIP, zerodha.getId(), salary.getId(),
                new BigDecimal("2500.00"), dueDay, null, null, null, null, null)).investment().getId();

        Commitment bill = commitmentService.createFromInvestment(sipId).commitment();
        assertThat(bill.getSettleAs()).isEqualTo(TransactionType.INVESTMENT);
        assertThat(bill.getToAccountId()).isEqualTo(zerodha.getId());
        assertThat(bill.getFixedAmount()).isEqualByComparingTo("2500.00");
        assertThat(bill.getDueDay()).isEqualTo(dueDay);

        // An expense of the same amount on the same day is not the SIP.
        Long expense = record(TransactionType.EXPENSE, salary.getId(), null, "2500.00");
        CommitmentInstance open = occurrenceOf(bill.getId());
        assertThat(open.getStatus()).isNotEqualTo(CommitmentInstanceStatus.PAID);
        assertThatThrownBy(() -> instanceService.settle(open.getId(),
                new SettleCommitmentInstanceRequest(expense, new BigDecimal("2500.00"))))
                .isInstanceOf(BusinessRuleException.class);

        record(TransactionType.INVESTMENT, salary.getId(), zerodha.getId(), "2500.00");
        assertThat(occurrenceOf(bill.getId()).getStatus()).isEqualTo(CommitmentInstanceStatus.PAID);
    }

    @Test
    @DisplayName("a transfer bill needs somewhere for the money to go")
    void transferNeedsDestination() {
        assertThatThrownBy(() -> commitmentService.create(new CreateCommitmentRequest(
                "Savings", CommitmentAmountType.FIXED, new BigDecimal("1000.00"),
                CommitmentFrequency.MONTHLY, dueDay, salary.getId(), null, true, false, cycle.getStartDate(), null,
                null, null, TransactionType.TRANSFER, null, null, null)))
                .isInstanceOf(BusinessRuleException.class);
    }
}
