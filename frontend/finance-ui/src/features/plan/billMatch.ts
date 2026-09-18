import type { CommitmentResponse } from '@/types/commitmentRule';
import type { InvestmentResponse } from '@/types/investment';
import type { LoanResponse } from '@/types/loan';

/** What a hand-typed bill is compared against when offering to link it. */
export interface BillMatchTarget {
  kind: 'LOAN' | 'INVESTMENT';
  /** The server's own amount string ("6145.00") - compared for equality, never added up. */
  amount: string | null;
  /** Names the bill might mention: the lender or holding, and its account. */
  names: (string | null | undefined)[];
  payFromAccountId: number | null | undefined;
}

export interface MatchableBill {
  name: string;
  amountType: string;
  fixedAmount: string | null;
  accountId?: number | null;
}

/** Words that say what kind of payment a bill is, when its name doesn't mention the lender. */
const KIND_WORDS: Record<BillMatchTarget['kind'], string[]> = {
  LOAN: ['emi', 'loan'],
  INVESTMENT: ['sip', 'rd', 'invest', 'investment', 'mutual', 'deposit'],
};

const words = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2);

/**
 * How much a bill looks like this loan's EMI or holding's instalment; 0 means not at all.
 *
 * <p>The amount alone isn't enough - "Petrol ₹2,500" is not the ₹2,500 SIP. The bill's name
 * must also share a word with the lender / holding / its account, or say what kind of
 * payment it is ("EMI", "SIP"). Leaving the same account breaks ties.
 */
export function billLikeness(bill: MatchableBill, target: BillMatchTarget): number {
  if (bill.amountType !== 'FIXED' || !bill.fixedAmount || bill.fixedAmount !== target.amount) return 0;
  const billWords = new Set(words(bill.name));
  const shared = target.names.some((n) => n != null && words(n).some((w) => w.length >= 3 && billWords.has(w)));
  const kind = KIND_WORDS[target.kind].some((w) => billWords.has(w));
  if (!shared && !kind) return 0;
  return (shared ? 2 : 1) + (bill.accountId != null && bill.accountId === target.payFromAccountId ? 1 : 0);
}

export const loanTarget = (loan: LoanResponse): BillMatchTarget => ({
  kind: 'LOAN',
  amount: loan.emi,
  names: [loan.lender, loan.account?.name],
  payFromAccountId: loan.payFromAccount?.id,
});

export const investmentTarget = (investment: InvestmentResponse): BillMatchTarget => ({
  kind: 'INVESTMENT',
  amount: investment.monthlyContribution,
  names: [investment.name, investment.account?.name],
  payFromAccountId: investment.payFromAccount?.id,
});

/** The unlinked hand-typed bill that most looks like the target, if any does. */
export function bestManualBill(target: BillMatchTarget, rules: CommitmentResponse[] | undefined): CommitmentResponse | undefined {
  let best: CommitmentResponse | undefined;
  let bestScore = 0;
  for (const r of rules ?? []) {
    if (r.sourceType !== 'MANUAL' || r.archived) continue;
    const score = billLikeness({ name: r.name, amountType: r.amountType, fixedAmount: r.fixedAmount, accountId: r.account.id }, target);
    if (score > bestScore) {
      best = r;
      bestScore = score;
    }
  }
  return best;
}

/** The source among these that the bill most looks like, if any does. */
export function bestTarget<T>(bill: MatchableBill, sources: T[], toTarget: (s: T) => BillMatchTarget): T | undefined {
  let best: T | undefined;
  let bestScore = 0;
  for (const s of sources) {
    const score = billLikeness(bill, toTarget(s));
    if (score > bestScore) {
      best = s;
      bestScore = score;
    }
  }
  return best;
}
