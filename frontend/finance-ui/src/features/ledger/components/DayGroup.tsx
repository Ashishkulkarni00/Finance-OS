import { Amount } from '@/components/Amount';
import { TransactionRow } from './TransactionRow';
import { isToday, isYesterday } from '@/lib/dates';
import { cn } from '@/lib/cn';
import type { DaySubtotalResponse, TransactionResponse } from '@/types/transaction';
import type { CategoryResponse } from '@/types/category';

const WEEKDAY = new Intl.DateTimeFormat('en-IN', { weekday: 'long' });
const MONTH_YEAR = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });

/** "−₹3,209  +₹57,700" - the day header's trailing figures. Money out, money in and
 *  transferred stay three separate clauses, same discipline as Zone 1: a mixed day never
 *  collapses into one net. */
function DayFigure({ subtotal }: { subtotal: DaySubtotalResponse | undefined }) {
  if (!subtotal) return null;
  const hasOut = Number(subtotal.moneyOut) > 0;
  const hasIn = Number(subtotal.moneyIn) > 0;
  const hasTransfers = Number(subtotal.transferred) > 0;
  if (!hasOut && !hasIn && !hasTransfers) return null;

  return (
    <span className="inline-flex shrink-0 items-baseline gap-space-4">
      {hasOut && (
        <span className="inline-flex items-baseline">
          <span className="num mr-[0.1em] text-critical">−</span>
          <Amount value={subtotal.moneyOut} role="caption" className="text-ink-soft" />
        </span>
      )}
      {hasIn && (
        <span className="inline-flex items-baseline">
          <span className="num mr-[0.1em] text-positive">+</span>
          <Amount value={subtotal.moneyIn} role="caption" className="text-positive" />
        </span>
      )}
      {hasTransfers && (
        <span className="inline-flex items-baseline gap-space-1 text-caption text-ink-muted">
          <Amount value={subtotal.transferred} role="caption" className="text-ink-muted" />
          moved
        </span>
      )}
    </span>
  );
}

interface DayGroupProps {
  date: string;
  transactions: TransactionResponse[];
  subtotal: DaySubtotalResponse | undefined;
  categories: CategoryResponse[];
  onEdit: (transaction: TransactionResponse) => void;
}

/**
 * Zone 4 - one day's worth of rows under a dated header carrying that day's
 * server-computed subtotal. The subtotal comes from `daySubtotals`, not from summing the
 * rows rendered here - so it stays correct even before every row for the day has loaded
 * (LEDGER_UX_SPEC.md §2 Zone 4, §11).
 *
 * <p>The header used to be the shared `GroupBand`: a pale filled pill with the date set
 * in the same 11px uppercase as a column label. Against rows whose names are 16px, the
 * thing dividing the list was the quietest text on the page - the day boundaries read as
 * faint stripes rather than as the structure of the ledger. It now leads with the day of
 * the month as a figure, the way a diary or a bank statement does, with the weekday and
 * month beneath it and a rule running out to the day's totals.
 *
 * <p>It is also `sticky`: `<main>` is the scroll container (see `AppShell`), so while you
 * are inside a long day the date it belongs to stays on screen. Scrolling a ledger and
 * losing track of which day you are looking at is the specific failure this fixes.
 */
export function DayGroup({ date, transactions, subtotal, categories, onEdit }: DayGroupProps) {
  const parsed = new Date(date);
  const today = isToday(date);
  const relative = today ? 'Today' : isYesterday(date) ? 'Yesterday' : null;

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 -mx-space-2 mb-space-1 flex items-center gap-space-3 bg-ground px-space-2 pb-space-2 pt-space-3">
        <span
          className={cn('num shrink-0 text-section leading-none', today ? 'text-accent' : 'text-ink')}
          aria-hidden
        >
          {parsed.getDate()}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className={cn('truncate text-label', today ? 'text-accent' : 'text-ink')}>
            {relative ?? WEEKDAY.format(parsed)}
          </span>
          <span className="truncate text-caption text-ink-muted">
            {relative ? `${WEEKDAY.format(parsed)}, ${MONTH_YEAR.format(parsed)}` : MONTH_YEAR.format(parsed)}
          </span>
        </span>
        <span aria-hidden className={cn('h-px flex-1', today ? 'bg-accent/30' : 'bg-line')} />
        <DayFigure subtotal={subtotal} />
      </div>

      {transactions.map((t) => (
        <TransactionRow key={t.id} transaction={t} categories={categories} onClick={() => onEdit(t)} />
      ))}
    </div>
  );
}
