package com.finance.account;

import com.finance.account.domain.Account;
import com.finance.common.money.MoneyScale;
import com.finance.reservation.ReservationRepository;
import com.finance.reservation.domain.Reservation;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Derives what's actually available to spend on an account, as distinct from its
 * balance. "HDFC Premium — balance ₹25,000, available ₹0" is the case this exists for:
 * a mandatory minimum balance isn't yours to spend without a penalty, and a balance
 * figure alone hides that. See docs/product/ACCOUNTS_EXPERIENCE.md §2.
 *
 * <pre>
 *   locked    = max(reserved, minimum balance if mandatory else 0)
 *   available = balance − locked
 * </pre>
 *
 * <p><strong>Why max, not both subtracted:</strong> a reservation and a mandatory
 * minimum are frequently the same money wearing two labels - a user reserving exactly
 * their emergency fund on the account that also requires that fund as its MAB, say.
 * Subtracting both would double-count that overlap and understate what's available
 * (the seeded HDFC Premium case: reserved ₹25,000, minimum ₹25,000 mandatory, one real
 * constraint - the source Excel's own Available column treats it the same way, as
 * `balance − reserved` with the minimum already reflected in what got reserved). Where
 * a reservation is for something unrelated and larger than the minimum, or there's no
 * reservation at all, {@code max} still yields the true binding constraint.
 *
 * <p>Deliberately not floored at zero - a negative available figure is a real, honest
 * fact (the account is already short of what it needs to be), the same philosophy Real
 * Balance already applies. Same circular-dependency rationale as
 * {@code AccountBalanceCalculator} for reading the repository directly rather than
 * going through a service interface.
 */
@Component
public class AccountAvailableCalculator {

    private final ReservationRepository reservationRepository;

    public AccountAvailableCalculator(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    public BigDecimal available(Account account, BigDecimal balance) {
        return available(balance, hold(account));
    }

    /** For callers that already hold the breakdown - keeps the subtraction itself in one
     *  place rather than letting a mapper re-derive it and drift. */
    public BigDecimal available(BigDecimal balance, AccountHold hold) {
        return MoneyScale.normalise(balance.subtract(hold.locked()));
    }

    /**
     * The same calculation, with its workings left in.
     *
     * <p>A screen showing "balance ₹33,000 · available ₹8,000" and nothing else has
     * stated a fact and withheld the reason for it, which reads as arbitrary. The parts
     * are what let it say <em>why</em>: ₹25,000 is reserved, and the reservations
     * themselves are labelled ("Emergency fund"), so the gap has a name.
     */
    public AccountHold hold(Account account) {
        BigDecimal reserved = reservationRepository.sumReservedForAccount(account.getId(), account.getUserId());
        BigDecimal minimumHold = account.isMinimumBalanceMandatory() && account.getMinimumBalance() != null
                ? account.getMinimumBalance() : BigDecimal.ZERO;

        List<String> reservedFor = reservationRepository.findByAccountIdAndDeletedAtIsNull(account.getId()).stream()
                .filter(r -> r.getUserId().equals(account.getUserId()))
                .map(Reservation::getPurpose)
                .toList();

        return new AccountHold(
                MoneyScale.normalise(reserved),
                MoneyScale.normalise(minimumHold),
                MoneyScale.normalise(reserved.max(minimumHold)),
                reservedFor);
    }
}
