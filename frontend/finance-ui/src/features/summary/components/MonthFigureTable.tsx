import { ScrollStrip } from '@/components/ScrollStrip';
import type { ReactNode } from 'react';
import { Amount } from '@/components/Amount';
import { cn } from '@/lib/cn';
import type { Money } from '@/lib/money';
import type { ReviewMonth } from '@/types/review';

export interface MonthColumn {
  key: string;
  head: string;
  /** A money figure, or undefined for "not known" - which renders as an em dash. */
  money?: (month: ReviewMonth) => Money | null | undefined;
  /** For a column that isn't money: a rate, a count. Owns its own formatting. */
  node?: (month: ReviewMonth) => ReactNode;
  /** Sets the column apart as the row's conclusion - a heavier rule and darker ink. */
  emphasis?: boolean;
}

interface MonthFigureTableProps {
  months: ReviewMonth[];
  columns: MonthColumn[];
  /** Newest first reads better in a table even though the chart above runs oldest first:
   *  a table is scanned from the top, and the top should be the month you are in. */
  newestFirst?: boolean;
  className?: string;
}

/**
 * The figures behind the chart above it - ruled, right-aligned, one row per salary month.
 *
 * <p>Not an optional extra. The chart draws the shape and prints almost nothing; this is
 * where the numbers are, and it is also the table view that makes the chart readable to
 * anyone who cannot see colour or cannot see the chart at all. `CLAUDE.md`'s bar for craft
 * is the spreadsheet this replaces, and a spreadsheet's answer to "how much exactly" is
 * never a hover.
 *
 * <p>An unrecorded month renders em dashes across the row rather than zeroes, and says so
 * under its own label - see `ReviewMonth`.
 */
export function MonthFigureTable({ months, columns, newestFirst = true, className }: MonthFigureTableProps) {
  const rows = newestFirst ? [...months].reverse() : months;
  const template = `minmax(0, 1.6fr) repeat(${columns.length}, minmax(0, 1fr))`;

  return (
    <ScrollStrip className={cn('w-full', className)}>
      <div className="grid min-w-[36rem] w-full" style={{ gridTemplateColumns: template }} role="table">
        <div className="contents" role="row">
          <span className="border-b border-ink-soft pb-space-2 text-caption text-ink" role="columnheader">
            Month
          </span>
          {columns.map((column) => (
            <span
              key={column.key}
              role="columnheader"
              className={cn(
                'border-b border-ink-soft pb-space-2 pl-space-4 text-right text-caption',
                column.emphasis ? 'text-ink' : 'text-ink-muted',
              )}
            >
              {column.head}
            </span>
          ))}
        </div>

        {rows.map((month) => (
          <div className="contents" key={month.cycleId} role="row">
            <span className="min-w-0 border-b border-line py-space-3" role="cell">
              <span className={cn('block truncate text-label', month.current ? 'font-medium text-ink' : 'text-ink-soft')}>
                {month.label}
              </span>
              <span className="block text-caption text-ink-muted">
                {month.current
                  ? 'this month, still running'
                  : month.recorded
                    ? month.closed
                      ? 'closed'
                      : 'ended'
                    : 'nothing recorded'}
              </span>
            </span>

            {columns.map((column) => (
              <span
                key={column.key}
                role="cell"
                className={cn(
                  'border-b border-line py-space-3 pl-space-4 text-right tabular-nums',
                  column.emphasis && 'font-medium',
                )}
              >
                {column.node ? (
                  column.node(month)
                ) : (
                  <Amount
                    value={column.money ? (column.money(month) ?? null) : null}
                    role="row"
                    className={column.emphasis ? 'text-ink' : 'text-ink-soft'}
                  />
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </ScrollStrip>
  );
}
