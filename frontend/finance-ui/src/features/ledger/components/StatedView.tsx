import { Amount } from '@/components/Amount';
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
 * Zone 1 - the screen's reason to exist. States what you're looking at and what it
 * totals, in one place, so a figure elsewhere in the product can link straight here and
 * the user lands somewhere that proves the number rather than a bare list
 * (LEDGER_EXPERIENCE.md §1, §4).
 *
 * <p>Never a single net. Money in and money out stay two figures - a "₹45,000" that is
 * secretly ₹57,700 income minus ₹12,700 expense explains nothing - and a transfer is
 * stated separately again, never folded into either: it's the same money in a different
 * pocket, not a gain or a loss (LEDGER_UX_SPEC.md §4).
 */
export function StatedView({ filters, summary, isLoading, cycle, accountName, categoryName }: StatedViewProps) {
  if (isLoading || !summary) {
    return (
      <div className="flex flex-col gap-space-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  const scope = [
    categoryName,
    accountName,
    filters.type ? TYPE_WORDS[filters.type] : undefined,
    filters.q ? `matching "${filters.q}"` : undefined,
  ].filter(Boolean);

  const timeframe =
    filters.cycle === 'all' ? 'all time' : cycle ? `this cycle · ${cycle.label}` : 'this cycle';

  const sentence =
    scope.length > 0
      ? `${scope.join(' · ')} · ${timeframe}`
      : `everything · ${timeframe}`;

  const hasIn = Number(summary.moneyIn) > 0;
  const hasOut = Number(summary.moneyOut) > 0;
  const hasTransfers = Number(summary.transferred) > 0;

  return (
    <div className="flex flex-col gap-space-2">
      <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Ledger</span>

      <div className="flex flex-wrap items-baseline gap-x-space-6 gap-y-space-1">
        {hasOut && (
          <div className="flex items-baseline gap-space-2">
            <Amount value={summary.moneyOut} role="hero" className="text-ink" />
            <span className="text-caption text-ink-muted">out</span>
          </div>
        )}
        {hasIn && (
          <div className="flex items-baseline gap-space-2">
            <Amount value={summary.moneyIn} role={hasOut ? 'section' : 'hero'} className="text-positive" signed />
            <span className="text-caption text-ink-muted">in</span>
          </div>
        )}
        {!hasIn && !hasOut && (
          <Amount value="0.00" role="hero" className="text-ink-muted" />
        )}
      </div>

      <p className="text-body text-ink-soft">
        {summary.entryCount} {summary.entryCount === 1 ? 'entry' : 'entries'} · {sentence}
        {hasTransfers && (
          <>
            {' · '}
            <Amount value={summary.transferred} role="caption" className="text-ink-muted" /> moved between your own accounts
          </>
        )}
      </p>
    </div>
  );
}
