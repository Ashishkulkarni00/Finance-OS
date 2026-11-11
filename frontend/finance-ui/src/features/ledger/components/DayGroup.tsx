import { Amount } from '@/components/Amount';
import { TransactionRow } from './TransactionRow';
import { isToday, isYesterday } from '@/lib/dates';
import { DateRule } from '@/components/DateRule';
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
          <span className="num mr-[0.1em] text-ink-muted">−</span>
          <Amount value={subtotal.moneyOut} role="caption" className="text-ink-soft" />
        </span>
      )}
      {hasIn && (
        <span className="inline-flex items-baseline">
          <span className="num mr-[0.1em] text-ink-muted">+</span>
          <Amount value={subtotal.moneyIn} role="caption" className="text-ink-soft" />
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
  /** Ids currently being deleted - shown dimmed, not hidden. */
  deleting?: ReadonlySet<number>;
  /** Pin the header while scrolling inside this day. Right in a long Ledger, wrong in a short group. */
  sticky?: boolean;
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
export function DayGroup({ date, transactions, subtotal, categories, onEdit, deleting, sticky = true }: DayGroupProps) {
  const parsed = new Date(date);
  const today = isToday(date);
  const relative = today ? 'Today' : isYesterday(date) ? 'Yesterday' : null;

  return (
    <div className="flex flex-col">
      <DateRule
        sticky={sticky}
        day={parsed.getDate()}
        tone={today ? 'accent' : 'ink'}
        line1={relative ?? WEEKDAY.format(parsed)}
        line2={relative ? `${WEEKDAY.format(parsed)}, ${MONTH_YEAR.format(parsed)}` : MONTH_YEAR.format(parsed)}
        trailing={<DayFigure subtotal={subtotal} />}
      />

      {transactions.map((t) => (
        <TransactionRow key={t.id} transaction={t} categories={categories} onClick={() => onEdit(t)} deleting={deleting?.has(t.id)} />
      ))}
    </div>
  );
}
