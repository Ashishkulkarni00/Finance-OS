import { Link } from 'react-router-dom';
import { useGetLoansQuery } from '@/services/loanService';
import { useGetInvestmentsQuery } from '@/services/investmentService';
import { useGetGoalsQuery } from '@/services/goalService';
import { formatMoney } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import type { AccountResponse } from '@/types/api';
import type { CommitmentSource } from '@/types/commitmentRule';
import type { GoalResponse } from '@/types/goal';
import type { InvestmentResponse } from '@/types/investment';
import type { LoanResponse } from '@/types/loan';
import { bestTarget, investmentTarget, loanTarget } from '../billMatch';

/** What a bill can follow, as one pick-list value: "LOAN:3", "INVESTMENT:1", "GOAL:2". */
export type SourceKey = `${Exclude<CommitmentSource, 'MANUAL'>}:${number}`;

export function sourceKey(type: CommitmentSource, id: number | null): SourceKey | null {
  return type === 'MANUAL' || id == null ? null : (`${type}:${id}` as SourceKey);
}

export function parseSourceKey(key: SourceKey | null): { type: Exclude<CommitmentSource, 'MANUAL'>; id: number } | null {
  if (!key) return null;
  const [type, id] = key.split(':');
  return { type: type as Exclude<CommitmentSource, 'MANUAL'>, id: Number(id) };
}

export interface BillSources {
  loans: LoanResponse[];
  investments: InvestmentResponse[];
  goals: GoalResponse[];
}

/** Loans, holdings and goals a bill could follow - the bill's own current one included. */
export function useBillSources(billId: number | null): BillSources {
  const { data: loansPage } = useGetLoansQuery();
  const { data: investmentsPage } = useGetInvestmentsQuery();
  const { data: goalsPage } = useGetGoalsQuery();
  return {
    loans: (loansPage?.content ?? []).filter(
      (l) => l.status !== 'CLOSED' && (l.planCommitmentId == null || l.planCommitmentId === billId),
    ),
    // A holding with a monthly amount and a paying account is something a bill can follow.
    investments: (investmentsPage?.content ?? []).filter(
      (i) => i.monthlyContribution != null && i.payFromAccount != null && (i.planCommitmentId == null || i.planCommitmentId === billId),
    ),
    // A goal kept in an account can receive a monthly transfer; several bills may fund one.
    goals: (goalsPage?.content ?? []).filter((g) => !g.archived && g.linkedAccountId != null),
  };
}

export function sourceOptions({ loans, investments, goals }: BillSources) {
  return [
    ...loans.map((l) => ({ value: `LOAN:${l.id}`, label: `Loan · ${l.lender} · ${formatMoney(l.emi)} EMI` })),
    ...investments.map((i) => ({ value: `INVESTMENT:${i.id}`, label: `Investment · ${i.name} · ${formatMoney(i.monthlyContribution)}` })),
    ...goals.map((g) => ({ value: `GOAL:${g.id}`, label: `Goal · ${g.name}` })),
  ];
}

/**
 * The record a hand-typed bill most likely is, so the form can offer to link it - never
 * links on its own. For a loan's EMI or a holding's instalment: the same amount and a name
 * that points at it ({@link bestTarget}); for a goal, the bill's name mentions it, or it
 * already moves money into the goal's account.
 */
export function suggestSource(
  bill: { name: string; amountType: string; fixedAmount: string | null; toAccountId: number | null; accountId?: number },
  sources: BillSources,
): { key: SourceKey; label: string } | null {
  const loan = bestTarget(bill, sources.loans.filter((l) => l.planCommitmentId == null), loanTarget);
  if (loan) return { key: `LOAN:${loan.id}`, label: `the ${loan.lender} loan’s EMI` };
  const holding = bestTarget(bill, sources.investments.filter((i) => i.planCommitmentId == null), investmentTarget);
  if (holding) return { key: `INVESTMENT:${holding.id}`, label: `the ${holding.name} instalment` };
  const name = bill.name.toLowerCase();
  const goal = sources.goals.find(
    (g) => name.includes(g.name.toLowerCase()) || (bill.toAccountId != null && bill.toAccountId === g.linkedAccountId),
  );
  return goal ? { key: `GOAL:${goal.id}`, label: `money for your ${goal.name} goal` } : null;
}

function FromHere({ to, what }: { to: string; what: string }) {
  return (
    <span className="text-caption text-ink-muted">
      From the {what}.{' '}
      <Link to={to} className="text-accent underline-offset-2 hover:underline">
        Edit the {what}
      </Link>{' '}
      to change these.
    </span>
  );
}

/** The read-only summary shown in place of the terms a loan or holding decides. */
export function LockedTerms({ loan, investment }: { loan?: LoanResponse; investment?: InvestmentResponse }) {
  if (loan) {
    return (
      <span className="flex flex-col gap-space-1">
        <span className="num text-label text-ink">
          Spent · {formatMoney(loan.emi)} every month{loan.emiDay ? ` on the ${Math.min(loan.emiDay, 28)}th` : ''} · from{' '}
          {loan.payFromAccount?.name ?? 'no account yet'}
          {loan.payoffDate ? ` · last ${formatShortDate(loan.payoffDate)}` : ''}
        </span>
        {!loan.payFromAccount && (
          <span className="text-caption text-critical">This loan has no paying account yet - record it on the loan first.</span>
        )}
        <FromHere to={`/loans/${loan.id}`} what="loan" />
      </span>
    );
  }
  if (investment) {
    return (
      <span className="flex flex-col gap-space-1">
        <span className="num text-label text-ink">
          Invested · {formatMoney(investment.monthlyContribution)} every month
          {investment.contributionDay ? ` on the ${Math.min(investment.contributionDay, 28)}th` : ''} · from{' '}
          {investment.payFromAccount?.name}
          {investment.account ? ` into ${investment.account.name}` : ''}
        </span>
        <FromHere to="/investments" what="holding" />
      </span>
    );
  }
  return null;
}

/** For a goal-funding bill: the money moves into the goal's account. */
export function GoalSettlement({ goal, accounts }: { goal: GoalResponse; accounts: AccountResponse[] }) {
  const into = accounts.find((a) => a.id === goal.linkedAccountId);
  return (
    <span className="flex flex-col gap-space-1">
      <span className="text-label text-ink">Moved to my own account · into {into?.name ?? 'the goal’s account'}</span>
      <span className="text-caption text-ink-muted">For your {goal.name} goal - the amount and day are yours to set.</span>
    </span>
  );
}
