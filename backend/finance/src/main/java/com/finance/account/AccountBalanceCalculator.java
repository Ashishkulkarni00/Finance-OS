package com.finance.account;

import com.finance.account.domain.Account;
import com.finance.common.money.MoneyScale;
import com.finance.transaction.PostingRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;

/**
 * Derives an account's current balance. The balance is never stored.
 *
 * <p><strong>The formula</strong>
 * <pre>
 *   currentBalance = openingBalance + sum(postings against this account
 *                                         dated after openingAsOf)
 * </pre>
 *
 * <p>Postings whose transaction has been soft-deleted are excluded - see
 * {@code PostingRepository.sumPostingsForAccount}. This is the seam milestone 1 left
 * open: one method changes, nothing else. See ADR-0011.
 *
 * <p><strong>Deliberate exception to "cross-feature calls go through the service
 * interface":</strong> this reads {@code PostingRepository} directly rather than
 * going through {@code TransactionService}. Routing it through the service would
 * create a real circular bean dependency - {@code AccountServiceImpl} depends on
 * {@code AccountMapper}, which depends on this class, which would depend on
 * {@code TransactionService}, whose implementation depends on {@code AccountService}
 * back to {@code AccountServiceImpl}. The query itself is a pure aggregate with no
 * transaction business logic, so reading it directly is the pragmatic side of that
 * trade-off, not an oversight.
 */
@Component
public class AccountBalanceCalculator {

    private final PostingRepository postingRepository;
    private final Clock clock;

    public AccountBalanceCalculator(PostingRepository postingRepository, Clock clock) {
        this.postingRepository = postingRepository;
        this.clock = clock;
    }

    public BigDecimal currentBalance(Account account) {
        BigDecimal postedSum = postingRepository.sumPostingsForAccount(
                account.getId(), account.getUserId(), account.getOpeningAsOf());
        return MoneyScale.normalise(account.getOpeningBalance().add(postedSum));
    }

    /**
     * The date the returned balance is true as at.
     *
     * <p>Now that transactions exist, the balance reflects every posting up to today.
     * Being explicit about this stops the UI implying more currency than the data has.
     */
    public LocalDate balanceAsOf(Account account) {
        return LocalDate.now(clock);
    }
}
