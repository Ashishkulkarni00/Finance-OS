package com.finance.position;

import java.math.BigDecimal;

/** Assets minus liabilities, projected automatically from every account's type. */
public record NetWorthResult(BigDecimal netWorth, BigDecimal totalAssets, BigDecimal totalLiabilities,
                             BigDecimal totalDebt) {
}
