import type { ReactNode } from 'react';
import { CalendarClock } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { formatSalaryDate } from '@/lib/dates';
import type { Money } from '@/lib/money';

/** A label over a figure: the unit of the panel's scannable row. */
function Stat({ label, children, note }: { label: string; children: ReactNode; note?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-[2px]">
      <span className="text-caption text-ink-muted">{label}</span>
      <span className="flex items-baseline gap-space-2">
        {children}
        {note && <span className="text-caption text-ink-muted">{note}</span>}
      </span>
    </div>
  );
}

/**
 * The salary countdown and the day's share, as one soft panel (2026-11-11 redesign of Today's top).
 *
 * <p>It carries four facts that used to be two sentences of grey text: **how long until salary**
 * and **the date it is expected**, then **today's share** and **how the day rate compares with the
 * person's usual**. Informative, not an alert: a teal wash, a hairline and no icon beyond the one
 * that names the countdown; amber/red are not used here at all (rule 8 - never judge).
 *
 * <p>Everything is a server field, passed in finished: `daysToSalary`, the cycle's end date,
 * `roomToday`, `spentToday`, and - only when the recovery engine says the month is stretched -
 * `perDayLess`, how far under the usual daily rate today's rate sits. Nothing is computed here.
 *
 * <p>Which two stats show depends on the state of the day: while there is room left it is what has
 * been spent against today's share; once the share is used it is the share and the comparison with
 * usual (the comparison only when there is one to make). A month that is short has no day rate at
 * all, so it keeps the countdown and drops the stats.
 */
export function SalaryPanel({
  daysToSalary,
  cycleEnd,
  roomToday,
  spentToday,
  used,
  belowUsual,
  showStats,
}: {
  daysToSalary: number;
  /** The cycle's last day; the salary lands the day after. */
  cycleEnd: string;
  roomToday: Money | null;
  spentToday: Money | null;
  /** Today's share has been used up. */
  used: boolean;
  /** How far under the usual daily rate today's rate is, when the month is stretched. */
  belowUsual: Money | null;
  /** False when the month is short or its figures are unknown. */
  showStats: boolean;
}) {
  const stats =
    showStats && roomToday != null
      ? used
        ? [
            <Stat key="share" label="Today’s share" note="used">
              <Amount value={roomToday} role="row" className="text-ink" />
            </Stat>,
            belowUsual != null ? (
              <Stat key="usual" label="Below your usual" note="a day">
                <Amount value={belowUsual} role="row" className="text-ink" />
              </Stat>
            ) : (
              <Stat key="spent" label="Spent today">
                <Amount value={spentToday} role="row" className="text-ink" />
              </Stat>
            ),
          ]
        : [
            <Stat key="spent" label="Spent today">
              <Amount value={spentToday} role="row" className="text-ink" />
            </Stat>,
            <Stat key="share" label="Today’s share">
              <Amount value={roomToday} role="row" className="text-ink" />
            </Stat>,
          ]
      : null;

  return (
    <section className="flex flex-col rounded-2xl bg-accent-wash px-space-4 py-space-3 ring-1 ring-inset ring-accent/15">
      <div className="flex items-center gap-space-3">
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-accent ring-1 ring-inset ring-accent/15">
          <CalendarClock size={16} strokeWidth={1.5} />
        </span>
        <span className="min-w-0 flex-1 text-label font-medium text-ink">
          <span className="num">{daysToSalary}</span> {daysToSalary === 1 ? 'day' : 'days'} to salary
        </span>
        <span className="num shrink-0 text-caption text-ink-soft">due {formatSalaryDate(cycleEnd)}</span>
      </div>
      {stats && (
        <div className="mt-space-3 grid grid-cols-2 gap-space-4 border-t border-accent/15 pt-space-3">{stats}</div>
      )}
    </section>
  );
}
