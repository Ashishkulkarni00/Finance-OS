package com.finance.card;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.card.domain.StatementStatus;
import com.finance.card.dto.CreateCardStatementRequest;
import com.finance.card.dto.CreateCreditCardRequest;
import com.finance.card.dto.CreateDebitCardRequest;
import com.finance.category.CategoryService;
import com.finance.category.domain.Category;
import com.finance.category.domain.CategoryGroup;
import com.finance.category.dto.CreateCategoryRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.loan.LoanService;
import com.finance.loan.domain.LoanPaidVia;
import com.finance.loan.dto.CreateLoanRequest;
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

/**
 * Credit cards against a real database: what's owed comes out of Real Balance once, the
 * bill tracks what's been paid since the statement, and debit cards only attach to banks.
 * Each test rolls back; figures are asserted as differences so other data can't interfere.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CreditCardIntegrationTest {

    @Autowired
    private CreditCardService creditCardService;
    @Autowired
    private CardService cardService;
    @Autowired
    private DebitCardService debitCardService;
    @Autowired
    private AccountService accountService;
    @Autowired
    private CategoryService categoryService;
    @Autowired
    private TransactionService transactionService;
    @Autowired
    private PositionService positionService;
    @Autowired
    private LoanService loanService;

    private final LocalDate today = LocalDate.now();
    private Account bank;
    private Category shopping;

    @BeforeEach
    void setUp() {
        bank = accountService.create(new CreateAccountRequest(
                "Card Test Bank", AccountType.BANK, null, null, null,
                new BigDecimal("50000.00"), today.minusMonths(3), null, null, null, null, null, null, null));
        shopping = categoryService.create(new CreateCategoryRequest("Card Test Shopping", CategoryGroup.FLEXIBLE, null, null));
    }

    private Long addCard(String owed, LocalDate asOf) {
        return creditCardService.create(new CreateCreditCardRequest(
                "Test Card", "Test Bank", "4321", null, new BigDecimal("100000"), 15, 5,
                bank.getId(), new BigDecimal(owed), asOf)).account().getId();
    }

    private void spendOnCard(Long cardId, String amount, LocalDate date) {
        transactionService.create(new CreateTransactionRequest(date, "Card spend", TransactionType.EXPENSE,
                new BigDecimal(amount), cardId, null, shopping.getId(), null, null), null);
    }

    private void payCard(Long cardId, String amount, LocalDate date) {
        transactionService.create(new CreateTransactionRequest(date, "Card bill", TransactionType.TRANSFER,
                new BigDecimal(amount), bank.getId(), cardId, null, null, null), null);
    }

    private BigDecimal realBalance() {
        return positionService.currentPosition().realBalance();
    }

    @Test
    @DisplayName("what's owed on a card comes out of Real Balance once - paying the bill doesn't take it out again")
    void cardDuesCountedOnce() {
        BigDecimal before = realBalance();

        Long cardId = addCard("5000", today.minusDays(60));
        BigDecimal afterCard = realBalance();
        assertThat(before.subtract(afterCard)).isEqualByComparingTo("5000");

        spendOnCard(cardId, "1000", today);
        BigDecimal afterSpend = realBalance();
        assertThat(afterCard.subtract(afterSpend)).isEqualByComparingTo("1000");

        payCard(cardId, "3000", today);
        assertThat(realBalance()).isEqualByComparingTo(afterSpend);
        assertThat(creditCardService.get(cardId).outstanding()).isEqualByComparingTo("3000");
    }

    @Test
    @DisplayName("a statement is pre-filled from the card's entries and tracks what's been paid since")
    void statementDraftAndProgress() {
        Long cardId = addCard("0", today.minusDays(40));
        spendOnCard(cardId, "2000", today.minusDays(20));
        LocalDate statementDate = today.minusDays(10);

        StatementDraft draft = cardService.statementDraft(cardId, statementDate);
        assertThat(draft.totalFromLedger()).isEqualByComparingTo("2000");
        assertThat(draft.alreadyRecorded()).isFalse();

        cardService.addStatement(cardId, new CreateCardStatementRequest(
                statementDate, today.plusDays(10), new BigDecimal("2000"), new BigDecimal("200")));

        payCard(cardId, "500", today.minusDays(5));
        CreditCardView partPaid = creditCardService.get(cardId);
        assertThat(partPaid.latestStatement().paidSince()).isEqualByComparingTo("500");
        assertThat(partPaid.latestStatement().remaining()).isEqualByComparingTo("1500");
        assertThat(partPaid.latestStatement().minimumDueRemaining()).isEqualByComparingTo("0");
        assertThat(partPaid.latestStatement().status()).isEqualTo(StatementStatus.DUE);

        payCard(cardId, "1500", today);
        assertThat(creditCardService.get(cardId).latestStatement().status()).isEqualTo(StatementStatus.PAID);
        assertThat(cardService.statementDraft(cardId, statementDate).alreadyRecorded()).isTrue();
    }

    @Test
    @DisplayName("EMIs paid from a card are listed on that card")
    void cardEmisShowOnTheirCard() {
        Long cardId = addCard("0", today.minusDays(10));
        Account loanAccount = accountService.create(new CreateAccountRequest(
                "Card Test Phone EMI", AccountType.LOAN, null, null, null,
                new BigDecimal("-10000"), today, null, null, null, null, null, null, null));
        LocalDate firstCharge = today.plusDays(3);
        loanService.create(new CreateLoanRequest(loanAccount.getId(), "Test Bank", new BigDecimal("10000"), today, 5,
                firstCharge, new BigDecimal("2000"), firstCharge.getDayOfMonth(), null, null, null, null, null,
                LoanPaidVia.CARD, null, null, cardId, null, null));

        CreditCardView card = creditCardService.get(cardId);
        assertThat(card.emis()).hasSize(1);
        assertThat(card.emis().get(0).nextChargeDate()).isEqualTo(firstCharge);
        assertThat(card.emis().get(0).emisLeft()).isEqualTo(5);
        assertThat(card.emiMonthlyTotal()).isEqualByComparingTo("2000");
    }

    @Test
    @DisplayName("a debit card belongs to a bank account, never to a card")
    void debitCardAttachesToBank() {
        DebitCardView debit = debitCardService.create(new CreateDebitCardRequest(bank.getId(), "Bank debit card", null, "1234"));
        assertThat(debit.account().getId()).isEqualTo(bank.getId());

        Long cardId = addCard("0", today);
        assertThatThrownBy(() -> debitCardService.create(new CreateDebitCardRequest(cardId, "Wrong", null, null)))
                .isInstanceOf(BusinessRuleException.class);
    }
}
