package com.finance.account;

import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.transaction.PostingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The formula milestone 2 was left as a seam for: {@code currentBalance = openingBalance
 * + sum(postings after openingAsOf)}. The correctness of the underlying SQL sum itself
 * is proved separately by {@code TransactionMoneyIntegrationTest} against real MySQL -
 * this class protects the arithmetic and rounding at this seam.
 */
class AccountBalanceCalculatorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 9, 9);

    private PostingRepository postingRepository;
    private AccountBalanceCalculator calculator;

    @BeforeEach
    void setUp() {
        postingRepository = mock(PostingRepository.class);
        Clock fixedClock = Clock.fixed(
                TODAY.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant(),
                ZoneId.of("Asia/Kolkata"));
        calculator = new AccountBalanceCalculator(postingRepository, fixedClock);
    }

    private Account account(BigDecimal openingBalance, LocalDate openingAsOf) {
        return Account.builder()
                .id(1L).userId(9L).name("Test").type(AccountType.BANK)
                .openingBalance(openingBalance).openingAsOf(openingAsOf)
                .build();
    }

    @Test
    @DisplayName("with no postings, balance equals the opening balance")
    void noPostingsMeansOpeningBalance() {
        when(postingRepository.sumPostingsForAccount(eq(1L), eq(9L), any())).thenReturn(BigDecimal.ZERO);

        Account account = account(new BigDecimal("32000.00"), LocalDate.of(2026, 9, 6));

        assertThat(calculator.currentBalance(account)).isEqualByComparingTo("32000.00");
    }

    @Test
    @DisplayName("balance is opening balance plus the posting sum")
    void addsPostingSum() {
        when(postingRepository.sumPostingsForAccount(eq(1L), eq(9L), any())).thenReturn(new BigDecimal("-2450.00"));

        Account account = account(new BigDecimal("32000.00"), LocalDate.of(2026, 9, 6));

        assertThat(calculator.currentBalance(account)).isEqualByComparingTo("29550.00");
    }

    @Test
    @DisplayName("a negative posting sum can take a card balance further negative")
    void handlesLiabilityAccountsGoingMoreNegative() {
        when(postingRepository.sumPostingsForAccount(eq(1L), eq(9L), any())).thenReturn(new BigDecimal("-1800.00"));

        Account card = account(new BigDecimal("-6375.00"), LocalDate.of(2026, 9, 6));

        assertThat(calculator.currentBalance(card)).isEqualByComparingTo("-8175.00");
    }

    @Test
    @DisplayName("the balance is normalised to two decimal places")
    void normalisesScale() {
        when(postingRepository.sumPostingsForAccount(eq(1L), eq(9L), any())).thenReturn(new BigDecimal("0.005"));

        Account account = account(new BigDecimal("100.00"), LocalDate.of(2026, 9, 6));

        assertThat(calculator.currentBalance(account)).hasToString("100.01");
    }

    @Test
    @DisplayName("balanceAsOf is today, now that transactions exist")
    void balanceAsOfIsToday() {
        Account account = account(new BigDecimal("100.00"), LocalDate.of(2026, 9, 6));

        assertThat(calculator.balanceAsOf(account)).isEqualTo(TODAY);
    }
}
