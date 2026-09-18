package com.finance.account;

import java.math.BigDecimal;
import java.util.List;

/**
 * Why an account's available figure is lower than its balance.
 *
 * @param reserved    total of the reservations against this account
 * @param minimumHold the minimum balance, but only when it's mandatory - an aspirational
 *                    minimum locks nothing
 * @param locked      what is actually subtracted: {@code max(reserved, minimumHold)},
 *                    never the sum - see {@link AccountAvailableCalculator} for why
 *                    double-counting the overlap would understate available
 * @param reservedFor the reservations' own labels ("Emergency fund"), so the UI can name
 *                    the money rather than just deduct it
 */
public record AccountHold(BigDecimal reserved, BigDecimal minimumHold, BigDecimal locked, List<String> reservedFor) {
}
