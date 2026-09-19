package com.finance.insight;

import java.util.List;

/** One kind of attention. Pure: reads the context, returns insights, touches nothing. */
public interface InsightRule {
    List<Insight> evaluate(FinancialContext context);
}
