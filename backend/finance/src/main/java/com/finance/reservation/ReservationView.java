package com.finance.reservation;

import com.finance.account.domain.Account;
import com.finance.reservation.domain.Reservation;

/** A reservation plus the account its summary needs - mirrors {@code TransactionView}. */
public record ReservationView(Reservation reservation, Account account) {
}
