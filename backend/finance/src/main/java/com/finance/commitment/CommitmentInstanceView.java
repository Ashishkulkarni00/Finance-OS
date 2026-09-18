package com.finance.commitment;

import com.finance.account.domain.Account;
import com.finance.category.domain.Category;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;

import java.time.LocalDate;

/**
 * An instance plus the rule behind it and the account it leaves from - everything a
 * worklist row needs without a second round trip. The account is carried here so the
 * Month row can name it inline ("IDBI") rather than hiding it behind a click: on a
 * pending item it's the difference between "₹2,500 due" and "₹2,500 due from the
 * account that's already short".
 *
 * @param settledOn when the money actually moved - the linked transaction's own date,
 *                  falling back to the day it was confirmed when nothing is linked.
 *                  Not {@code confirmedAt}, which is when the app was told; a row
 *                  labelled "Paid on" has to mean the payment, not the paperwork.
 *                  Null while unsettled.
 * @param category  the rule's category - This Month groups its plan by it. Null when
 *                  the bill has none.
 */
public record CommitmentInstanceView(CommitmentInstance instance, Commitment commitment, Account account,
                                     LocalDate settledOn, Category category) {
}
