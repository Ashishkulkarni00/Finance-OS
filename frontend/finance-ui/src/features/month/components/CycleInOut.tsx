import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Statement, StatementRow } from '@/components/Statement';
import { Skeleton } from '@/components/Skeleton';
import { formatPercent } from '@/lib/money';
import { useGetCycleSummaryQuery } from '@/services/cycleService';
import type { CycleResponse } from '@/types/cycle';

/** A statement label that opens the Ledger on exactly the entries behind its figure. */
function LedgerLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="underline-offset-4 transition-colors hover:text-ink hover:underline">
      {children}
    </Link>
  );
}

/**
 * Money in and out this cycle - the backward-looking half of `MonthOverview`. Every
 * figure comes from `GET /cycles/{id}/summary`; none is computed here.
 *
 * <p>It exists because Flexible spending showed ₹12,722 while the cycle's expenses were
 * ₹47,755, and nothing on the page accounted for the rest. Each labelled line opens the
 * Ledger on its own entries - the same justification loop the category rows use.
 *
 * <p>Compact on purpose - no notes column - because it now sits beside the crux rather
 * than as a section of its own. Deliberately no "other spending = money out − flexible"
 * line: that would be money arithmetic in the browser.
 */
export function CycleInOut({ cycle }: { cycle: CycleResponse | undefined }) {
  const { data, isLoading, isError } = useGetCycleSummaryQuery(cycle?.id ?? 0, { skip: !cycle });
  const ledger = (type?: string) => (cycle ? `/ledger?cycle=${cycle.id}${type ? `&type=${type}` : ''}` : '/ledger');

  return (
    <div className="flex flex-col gap-space-2">
      <div className="flex items-baseline justify-between gap-space-3">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">So far this cycle</span>
        {cycle && (
          <Link to={ledger()} className="text-caption text-accent underline-offset-4 hover:underline">
            Every entry →
          </Link>
        )}
      </div>

      {isLoading || !cycle ? (
        <Skeleton className="h-36 w-full" />
      ) : isError || !data ? (
        <p className="text-body text-ink-soft">We couldn’t load this cycle’s totals. Refresh to try again.</p>
      ) : (
        <>
          <Statement>
            <StatementRow label={<LedgerLink to={ledger('INCOME')}>Money in</LedgerLink>} value={data.incomeTotal} />
            <StatementRow label={<LedgerLink to={ledger('EXPENSE')}>Money out</LedgerLink>} value={data.expenseTotal} deduct />
            <StatementRow variant="subtotal" label="Left over" value={data.net} emphasiseNegative />
            {data.savingsRate != null && (
              <StatementRow
                label="Kept"
                valueNode={<span className="num text-row text-ink">{formatPercent(data.savingsRate)}</span>}
              />
            )}
            {Number(data.investedTotal) > 0 && (
              <StatementRow label={<LedgerLink to={ledger('INVESTMENT')}>Invested</LedgerLink>} value={data.investedTotal} />
            )}
          </Statement>
          <p className="text-caption text-ink-muted">
            Money out is every expense — bills and EMIs as well as day-to-day spending.
          </p>
        </>
      )}
    </div>
  );
}
