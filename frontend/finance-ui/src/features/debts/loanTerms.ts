import { formatMoney } from '@/lib/money';
import type { LoanResponse } from '@/types/loan';

/**
 * The plain-language reason a loan's figures don't agree, or null when they do (or when
 * there's no rate to check them with). Shared by the loan's own page and Debts' Needs a
 * look, so the two can't describe the same mismatch differently.
 *
 * <p>Every number here is the server's: `impliedEmisRemaining` is computed there.
 */
export function termsMismatch(loan: LoanResponse): string | null {
  if (loan.termsConsistent !== false || loan.annualRate == null) return null;

  const rate = `${loan.annualRate}% a year`;
  if (loan.impliedEmisRemaining == null || loan.impliedEmisRemaining < 0) {
    return `At ${rate}, an EMI of ${formatMoney(loan.emi)} doesn’t cover the monthly interest on ${formatMoney(loan.outstandingBalance)}, so it would never be paid off.`;
  }
  return `At ${rate}, an EMI of ${formatMoney(loan.emi)} clears ${formatMoney(loan.outstandingBalance)} in ${loan.impliedEmisRemaining} payments — but ${loan.emisRemaining} are entered as left.`;
}
