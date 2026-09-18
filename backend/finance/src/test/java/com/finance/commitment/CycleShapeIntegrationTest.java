package com.finance.commitment;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.category.CategoryService;
import com.finance.category.domain.CategoryGroup;
import com.finance.category.dto.CreateCategoryRequest;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.dto.CreateCommitmentRequest;
import com.finance.cycle.CycleService;
import com.finance.cycle.domain.Cycle;
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
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The month in one line (audit step 6): expected in − committed − planned savings =
 * flexible, and how much of flexible is spent. Each bill lands in exactly one bucket, and
 * money paying a bill is never also "spent".
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CycleShapeIntegrationTest {

    @Autowired
    private AccountService accountService;
    @Autowired
    private CommitmentService commitmentService;
    @Autowired
    private CommitmentInstanceService instanceService;
    @Autowired
    private CycleService cycleService;
    @Autowired
    private TransactionService transactionService;
    @Autowired
    private CategoryService categoryService;

    private Cycle cycle;
    private int day;
    private Account salary;
    private Long spendCategory;

    @BeforeEach
    void setUp() {
        cycle = cycleService.resolveCurrent();
        day = cycle.getStartDate().getDayOfMonth();
        assumeTrue(day <= 28, "cycle starts after the 28th");
        salary = account("Shape Test Salary", AccountType.BANK, true);
        spendCategory = categoryService.create(new CreateCategoryRequest("Shape Test Food", CategoryGroup.FLEXIBLE, null, null)).getId();
        instanceService.listForCycle(cycle.getId());
    }

    private Account account(String name, AccountType type, boolean spendable) {
        return accountService.create(new CreateAccountRequest(
                name, type, null, null, null, new BigDecimal(type == AccountType.BANK ? "100000.00" : "0.00"),
                cycle.getStartDate().minusMonths(1), null, null, null, spendable, null, null, null));
    }

    private void bill(String name, String amount, TransactionType settleAs, Long toAccountId, boolean mandatory) {
        commitmentService.create(new CreateCommitmentRequest(
                name, amount == null ? CommitmentAmountType.VARIABLE : CommitmentAmountType.FIXED,
                amount == null ? null : new BigDecimal(amount), CommitmentFrequency.MONTHLY, day, salary.getId(),
                settleAs == TransactionType.EXPENSE ? spendCategory : null, mandatory, false, cycle.getStartDate(), null,
                null, null, settleAs, toAccountId, null, null));
    }

    private void record(TransactionType type, String amount) {
        transactionService.create(new CreateTransactionRequest(
                cycle.getStartDate(), "Shape test", type, new BigDecimal(amount), salary.getId(), null,
                spendCategory, null, null), null);
    }

    private static BigDecimal delta(BigDecimal after, BigDecimal before) {
        return after.subtract(before);
    }

    @Test
    @DisplayName("each bill lands in one bucket: spent, set aside, or neither - and flexible is what's left of what comes in")
    void bucketsAndFlexible() {
        Account savings = account("Shape Test Emergency", AccountType.BANK, false);
        Account wallet = account("Shape Test Wallet", AccountType.CASH, true);
        Account demat = account("Shape Test Demat", AccountType.INVESTMENT, false);
        Account card = account("Shape Test Card", AccountType.CREDIT_CARD, false);
        CycleShape before = instanceService.shape(cycle.getId());

        bill("Salary", "50000.00", TransactionType.INCOME, null, true);
        bill("Rent", "20000.00", TransactionType.EXPENSE, null, true);
        bill("Card bill", "4000.00", TransactionType.TRANSFER, card.getId(), true);
        bill("SIP", "5000.00", TransactionType.INVESTMENT, demat.getId(), true);
        bill("Emergency fund", "10000.00", TransactionType.TRANSFER, savings.getId(), true);
        bill("Cash for the week", "3000.00", TransactionType.TRANSFER, wallet.getId(), true);
        bill("Streaming", "500.00", TransactionType.EXPENSE, null, false);

        CycleShape shape = instanceService.shape(cycle.getId());
        assertThat(delta(shape.expectedIn(), before.expectedIn())).isEqualByComparingTo("50000.00");
        // Rent + optional streaming + paying the card; not the move to the wallet.
        assertThat(delta(shape.committed(), before.committed())).isEqualByComparingTo("24500.00");
        assertThat(delta(shape.plannedSavings(), before.plannedSavings())).isEqualByComparingTo("15000.00");
        assertThat(shape.flexible())
                .isEqualByComparingTo(shape.expectedIn().subtract(shape.committed()).subtract(shape.plannedSavings()));
        assertThat(shape.state()).isNotEqualTo(CycleShape.State.NO_INCOME);
        assertThat(shape.cycleElapsed()).isBetween(BigDecimal.ZERO, BigDecimal.ONE);
    }

    @Test
    @DisplayName("spent is the spending no bill accounts for, less refunds - a bill's own payment isn't counted again")
    void spentIsUnplannedSpending() {
        bill("Salary", "50000.00", TransactionType.INCOME, null, true);
        bill("Rent", "20000.00", TransactionType.EXPENSE, null, true);
        CycleShape before = instanceService.shape(cycle.getId());

        record(TransactionType.EXPENSE, "20000.00");   // pays rent (auto-matched)
        record(TransactionType.EXPENSE, "1200.00");    // groceries
        CycleShape after = instanceService.shape(cycle.getId());
        assertThat(delta(after.spent(), before.spent())).isEqualByComparingTo("1200.00");
        // Paying rent doesn't change what was planned.
        assertThat(after.committed()).isEqualByComparingTo(before.committed());

        record(TransactionType.REFUND, "200.00");
        assertThat(delta(instanceService.shape(cycle.getId()).spent(), before.spent())).isEqualByComparingTo("1000.00");
    }

    @Test
    @DisplayName("a bill still needing an amount makes flexible an upper bound, and says so")
    void unknownAmountIsIncomplete() {
        bill("Salary", "50000.00", TransactionType.INCOME, null, true);
        CycleShape before = instanceService.shape(cycle.getId());
        bill("Electricity", null, TransactionType.EXPENSE, null, true);

        CycleShape shape = instanceService.shape(cycle.getId());
        assertThat(shape.state()).isEqualTo(CycleShape.State.INCOMPLETE);
        assertThat(shape.unknownAmountCount()).isEqualTo(before.unknownAmountCount() + 1);
        assertThat(shape.flexible()).isNotNull();
    }

    @Test
    @DisplayName("with nothing coming in, there's no flexible figure to show - not a zero, not a guess")
    void noIncomeHasNoFlexible() {
        Cycle far = cycleService.resolveForDate(LocalDate.of(2040, 1, 15));
        CycleShape shape = instanceService.shape(far.getId());
        assumeTrue(shape.expectedIn().signum() == 0, "some income rule reaches 2040 in the test database");
        assertThat(shape.state()).isEqualTo(CycleShape.State.NO_INCOME);
        assertThat(shape.flexible()).isNull();
        assertThat(shape.spentShare()).isNull();
        assertThat(shape.cycleElapsed()).isEqualByComparingTo("0");
    }
}
