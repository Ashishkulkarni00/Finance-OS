import { useMemo } from 'react';
import { useGetCommitmentRulesQuery } from '@/services/commitmentRuleService';

/**
 * What leaves each account every month, by name - the Excel's own "Purpose" column
 * ("Salary credit; bike loan EMI; credit-card payment"), which is how that sheet answers
 * "which EMI is running on what account".
 *
 * <p>Sourced from commitment rules, not from loans. A loan's `account` is the loan
 * liability itself ("Bike Loan"), not the account its EMI debits - reading it as the
 * paying account renders "EMI from Bike Loan", which is circular and wrong. The rule
 * ("Bike loan EMI" → HDFC Salary) is the only place that mapping is actually recorded.
 *
 * <p>Grouping names is not money arithmetic, so it belongs here rather than in an
 * endpoint; the moment this needs "₹8,700 leaves here monthly", that total has to be
 * server-computed.
 */
export function useOutgoingsByAccount(): Map<number, string[]> {
  const { data } = useGetCommitmentRulesQuery();

  return useMemo(() => {
    const byAccount = new Map<number, string[]>();
    for (const rule of data?.content ?? []) {
      if (rule.archived) continue;
      const existing = byAccount.get(rule.account.id);
      if (existing) {
        existing.push(rule.name);
      } else {
        byAccount.set(rule.account.id, [rule.name]);
      }
    }
    return byAccount;
  }, [data]);
}

/** "Bike loan EMI, Education loan EMI +2 more" - a row has space for two names, not eight. */
export function summariseOutgoings(names: string[] | undefined): string | undefined {
  if (!names || names.length === 0) return undefined;
  if (names.length <= 2) return names.join(' · ');
  return `${names.slice(0, 2).join(' · ')} +${names.length - 2} more`;
}
