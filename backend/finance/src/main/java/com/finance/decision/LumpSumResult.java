package com.finance.decision;

import java.math.BigDecimal;
import java.util.List;

/**
 * {@code GET /decisions/lump-sum} - ROADMAP 4.3, "the ₹50,000 question".
 *
 * @param runwayMonthsBefore months of must-pay bills reachable money covers today; null when unknown
 * @param breakEvenRate      the dearest costed loan's rate: an investment has to beat this, after
 *                           tax and with certainty, to do better than prepaying it. Null with no
 *                           costed loan. <strong>No investment return is ever assumed</strong> -
 *                           only the bar it would have to clear is stated
 * @param breakEvenLoan      which loan sets that bar
 */
public record LumpSumResult(BigDecimal amount, BigDecimal runwayMonthsBefore, BigDecimal breakEvenRate,
                            String breakEvenLoan, List<LumpSumOption> options) {
}
