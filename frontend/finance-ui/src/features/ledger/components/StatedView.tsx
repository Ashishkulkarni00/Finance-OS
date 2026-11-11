import { Amount } from '@/components/Amount';
import { FactStrip, type Fact } from '@/components/FactStrip';
import { Skeleton } from '@/components/Skeleton';
import type { LedgerFilterState } from '../useLedgerFilters';
import type { TransactionViewSummaryResponse } from '@/types/transaction';
import type { CycleResponse } from '@/types/cycle';

const TYPE_WORDS: Record<string, string> = {
  EXPENSE: 'expenses',
  INCOME: 'income',
  TRANSFER: 'transfers',
  INVESTMENT: 'investments',
  REFUND: 'refunds',
};

interface StatedViewProps {
  filters: LedgerFilterState;
  summary: TransactionViewSummaryResponse | undefined;
  isLoading: boolean;
  cycle: CycleResponse | undefined;
  accountName: string | undefined;
  categoryName: string | undefined;
}

/**
 * What the list below adds up to, as the server states it (UI_UX_REVAMP_PLAN 4.4): money out, money
 * in, how many entries, and - only when there are any - what moved between the user's own accounts.
 * One quiet row of facts and one sentence saying what "this view" is. It replaced two hero-sized
 * figures; the ledger's job is the list, and the summary is the caption to it.
 *
 * <p>Every figure is the server's `summary`; nothing is added up here. Direction is said by the
 * word, not by colour (income is not green).
 */
export function StatedView({ filters, summary, isLoading, cycle, accountName, categoryName }: StatedViewProps) {
  if (isLoading || !summary) {
    return (
      <div className="flex flex-col gap-space-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  const scope = [
    categoryName,
    accountName,
    filters.type ? TYPE_WORDS[filters.type] : undefined,
    filters.q ? `matching "${filters.q}"` : undefined,
  ].filter(Boolean);

  const timeframe = filters.cycle === 'all' ? 'all time' : cycle ? `this cycle · ${cycle.label}` : 'this cycle';
  const sentence = scope.length > 0 ? `${scope.join(' · ')} · ${timeframe}` : `everything · ${timeframe}`;

  const facts: Fact[] = [
    { label: 'Money out', value: <Amount value={summary.moneyOut} role="row" /> },
    { label: 'Money in', value: <Amount value={summary.moneyIn} role="row" /> },
    { label: summary.entryCount === 1 ? 'Entry' : 'Entries', value: summary.entryCount },
  ];
  if (Number(summary.transferred) > 0) {
    facts.push({ label: 'Between accounts', value: <Amount value={summary.transferred} role="row" className="text-ink-muted" /> });
  }

  return (
    <div className="m-card flex flex-col gap-space-2">
      <FactStrip facts={facts} className="border-y border-line" />
      <p className="text-caption text-ink-muted">{sentence}</p>
    </div>
  );
}
