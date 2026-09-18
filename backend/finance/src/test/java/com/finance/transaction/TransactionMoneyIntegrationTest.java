package com.finance.transaction;

import com.finance.account.AccountBalanceCalculator;
import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.category.CategoryService;
import com.finance.category.domain.Category;
import com.finance.category.domain.CategoryGroup;
import com.finance.category.dto.CreateCategoryRequest;
import com.finance.transaction.domain.TransactionType;
import com.finance.transaction.dto.CreateTransactionRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves the must-have money-integrity cases from {@code TECHNICAL_ARCHITECTURE.md}
 * §5 against a real MySQL database - not mocks. A mocked {@code PostingRepository}
 * can prove the service calls the right methods; only a real database proves the
 * JPQL sum query and the account-balance arithmetic actually compose correctly
 * end to end.
 *
 * <p>Each test runs inside a transaction that rolls back afterwards, so repeated runs
 * never accumulate data in {@code finance_planner_test} and never collide with the
 * seeded categories from {@code V2__categories_and_transactions.sql}.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TransactionMoneyIntegrationTest {

    @Autowired
    private AccountService accountService;
    @Autowired
    private CategoryService categoryService;
    @Autowired
    private TransactionService transactionService;
    @Autowired
    private AccountBalanceCalculator balanceCalculator;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Account openAccount(String name, AccountType type, String openingBalance) {
        CreateAccountRequest request = new CreateAccountRequest(
                name, type, null, null, null,
                new BigDecimal(openingBalance), LocalDate.of(2026, 9, 1),
                null, null, null, null, null, null, null);
        return accountService.create(request);
    }

    private Category testCategory() {
        return categoryService.create(new CreateCategoryRequest("Integration Test Category", CategoryGroup.FLEXIBLE, null, null));
    }

    /** Income needs a category from the INCOME group - enforced since V11, because
     *  "Salary Credit" had been sitting in a discretionary-spending group since the
     *  categories were first seeded. A spending category here is now rejected. */
    private Category testIncomeCategory() {
        return categoryService.create(new CreateCategoryRequest("Integration Test Income", CategoryGroup.INCOME, null, null));
    }

    private void post(TransactionType type, Long accountId, Long toAccountId, Long categoryId, String amount) {
        transactionService.create(new CreateTransactionRequest(
                LocalDate.of(2026, 9, 8), "Integration test", type, new BigDecimal(amount),
                accountId, toAccountId, categoryId, null, null), null);
    }

    @Test
    @DisplayName("a card purchase then its bill payment leaves the card exactly where it started - spending counted once")
    void cardPurchaseThenBillPaymentCountsOnce() {
        Account bank = openAccount("Integration Bank", AccountType.BANK, "50000.00");
        Account card = openAccount("Integration Card", AccountType.CREDIT_CARD, "-6375.00");
        Category category = testCategory();

        post(TransactionType.EXPENSE, card.getId(), null, category.getId(), "1800.00");
        post(TransactionType.TRANSFER, bank.getId(), card.getId(), null, "1800.00");

        BigDecimal cardBalance = balanceCalculator.currentBalance(accountService.getById(card.getId()));
        BigDecimal bankBalance = balanceCalculator.currentBalance(accountService.getById(bank.getId()));

        // The purchase increased what's owed by 1800; the payment reduced it by 1800.
        // If the purchase were ever double-counted, this would not land back on -6375.00.
        assertThat(cardBalance).isEqualByComparingTo("-6375.00");
        assertThat(bankBalance).isEqualByComparingTo("48200.00");
    }

    @Test
    @DisplayName("a cash withdrawal is not spending - only the later cash expense is")
    void cashWithdrawalCountsOnceAtTheSpend() {
        Account bank = openAccount("Integration Bank 2", AccountType.BANK, "50000.00");
        Account wallet = openAccount("Integration Wallet", AccountType.CASH, "0.00");
        Category category = testCategory();

        post(TransactionType.TRANSFER, bank.getId(), wallet.getId(), null, "3000.00");
        post(TransactionType.EXPENSE, wallet.getId(), null, category.getId(), "500.00");

        BigDecimal bankBalance = balanceCalculator.currentBalance(accountService.getById(bank.getId()));
        BigDecimal walletBalance = balanceCalculator.currentBalance(accountService.getById(wallet.getId()));

        // The bank only ever loses the withdrawn 3000 - never also the 500 spent from cash,
        // which would be the same rupee counted twice.
        assertThat(bankBalance).isEqualByComparingTo("47000.00");
        assertThat(walletBalance).isEqualByComparingTo("2500.00");
    }

    @Test
    @DisplayName("a refund offsets its original expense on the same account")
    void refundOffsetsTheOriginalExpense() {
        Account bank = openAccount("Integration Bank 3", AccountType.BANK, "50000.00");
        Category category = testCategory();

        post(TransactionType.EXPENSE, bank.getId(), null, category.getId(), "500.00");
        post(TransactionType.REFUND, bank.getId(), null, category.getId(), "150.00");

        BigDecimal balance = balanceCalculator.currentBalance(accountService.getById(bank.getId()));

        assertThat(balance).isEqualByComparingTo("49650.00");
    }

    @Test
    @DisplayName("a refund to a credit card lowers what's owed on it by exactly the refund")
    void refundToCardLowersWhatIsOwed() {
        Account card = openAccount("Integration Card 2", AccountType.CREDIT_CARD, "-6375.00");
        Category category = testCategory();

        post(TransactionType.EXPENSE, card.getId(), null, category.getId(), "2000.00");
        post(TransactionType.REFUND, card.getId(), null, category.getId(), "2000.00");

        BigDecimal cardBalance = balanceCalculator.currentBalance(accountService.getById(card.getId()));

        // Purchase and its full refund cancel out: the card owes what it did before.
        assertThat(cardBalance).isEqualByComparingTo("-6375.00");
    }

    @Test
    @DisplayName("an investment moves money between two assets - the source account balance moves by exactly the amount")
    void investmentMovesMoneyBetweenAssets() {
        Account bank = openAccount("Integration Bank 4", AccountType.BANK, "50000.00");
        Account sip = openAccount("Integration SIP", AccountType.INVESTMENT, "0.00");

        post(TransactionType.INVESTMENT, bank.getId(), sip.getId(), null, "5000.00");

        assertThat(balanceCalculator.currentBalance(accountService.getById(bank.getId()))).isEqualByComparingTo("45000.00");
        assertThat(balanceCalculator.currentBalance(accountService.getById(sip.getId()))).isEqualByComparingTo("5000.00");
    }

    @Test
    @DisplayName("two-account movements individually net to zero; the ledger-wide total is exactly the net external flow")
    void postingsNeverLeakOrDuplicateMoney() {
        Account bank = openAccount("Integration Bank 5", AccountType.BANK, "50000.00");
        Account card = openAccount("Integration Card 5", AccountType.CREDIT_CARD, "0.00");
        Account wallet = openAccount("Integration Wallet 5", AccountType.CASH, "0.00");
        Category category = testCategory();

        post(TransactionType.EXPENSE, card.getId(), null, category.getId(), "1200.00");
        post(TransactionType.TRANSFER, bank.getId(), card.getId(), null, "1200.00");
        post(TransactionType.TRANSFER, bank.getId(), wallet.getId(), null, "2000.00");
        post(TransactionType.EXPENSE, wallet.getId(), null, category.getId(), "300.00");
        post(TransactionType.INCOME, bank.getId(), null, testIncomeCategory().getId(), "10000.00");

        // Every TRANSFER/INVESTMENT row, grouped by its own transaction, nets to zero -
        // that is the actual double-entry invariant (see PostingFactory).
        Integer unbalancedTransfers = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM (
                    SELECT p.transaction_id, SUM(p.amount) AS net
                    FROM postings p
                    JOIN transactions t ON t.id = p.transaction_id
                    WHERE t.type IN ('TRANSFER', 'INVESTMENT')
                    GROUP BY p.transaction_id
                    HAVING net <> 0
                ) unbalanced
                """, Integer.class);
        assertThat(unbalancedTransfers).isZero();

        // The ledger-wide total is exactly income minus expense - not zero, and not
        // anything else. If the card purchase or the cash spend had been counted
        // twice anywhere, this total would be wrong.
        BigDecimal total = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM postings", BigDecimal.class);
        assertThat(total).isEqualByComparingTo("8500.00"); // 10000 income - 1200 expense - 300 expense
    }

    @Test
    @DisplayName("a double-tapped Save with the same idempotency key creates only one transaction, against the real database")
    void idempotentDoublePostCreatesOnlyOne() {
        Account bank = openAccount("Integration Bank 6", AccountType.BANK, "50000.00");
        Category category = testCategory();
        CreateTransactionRequest request = new CreateTransactionRequest(
                LocalDate.of(2026, 9, 8), "Double-tap test", TransactionType.EXPENSE,
                new BigDecimal("99.00"), bank.getId(), null, category.getId(), null, null);

        TransactionView first = transactionService.create(request, "integration-test-key");
        TransactionView second = transactionService.create(request, "integration-test-key");

        assertThat(second.transaction().getId()).isEqualTo(first.transaction().getId());

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM transactions WHERE id = ?", Integer.class, first.transaction().getId());
        assertThat(count).isEqualTo(1);

        BigDecimal balance = balanceCalculator.currentBalance(accountService.getById(bank.getId()));
        assertThat(balance).isEqualByComparingTo("49901.00");
    }
}
