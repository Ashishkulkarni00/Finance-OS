package com.finance.cycle;

import java.math.BigDecimal;

/**
 * One category's expense total for a cycle - "where the money went", largest first.
 *
 * <p>{@code share} is that amount as a fraction of the group's own total (0.38 means
 * 38%), never pre-multiplied - the same convention as {@code savingsRate} and
 * {@code committedShare}. Null when the total is zero, because a share of nothing is
 * not zero, it's undefined. It is computed here rather than in the browser for the
 * same reason every other derived figure is: a ratio of money is money arithmetic.
 */
public record CategorySpend(Long categoryId, String categoryName, String categoryGroup,
                            BigDecimal amount, BigDecimal share) {
}
