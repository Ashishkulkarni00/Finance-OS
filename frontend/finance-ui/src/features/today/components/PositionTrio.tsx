import type { ReactNode } from 'react';
import { Amount } from '@/components/Amount';
import { cn } from '@/lib/cn';
import type { Money } from '@/lib/money';

/**
 * Today's three supporting numbers (2026-11-10 redesign): **free until salary ÷ days to salary =
 * a day from here**, laid out as the sum it is.
 *
 * <p>The old version was three equal 15px cells that read as three unrelated facts. They are one
 * derivation, so the order is the arithmetic: the big figure on the left is the month's free
 * money, the day count is the divisor, and the last cell is the quotient. Small operators sit on
 * the hairlines between cells so the working is visible without a tap - the spreadsheet's
 * craft (aligned figures, visible derivations, ruled density), no boxes, no tinted backgrounds.
 *
 * <p>Pure layout: every value arrives finished from the server, so this can never do money
 * arithmetic. The operators are decoration on a derivation the server already computed.
 */
export function PositionTrio({
  free,
  days,
  perDay,
  salaryOn,
}: {
  free: Money | null;
  days: number;
  perDay: Money | null;
  /** Payday as a plain date, e.g. "28 Nov". */
  salaryOn: string;
}) {
  return (
    // Phone: three across, short labels, no notes - the sum reads in one line inside the hero
    // card (2026-11-11). Wide: the original ruled strip with notes.
    <dl className="grid grid-cols-3 border-t border-line md:grid-cols-[1.5fr_1fr_1fr] md:border-y">
      <Cell label="Free until salary" short="Free" note="after everything promised">
        <Amount value={free} role="section" emphasiseNegative />
      </Cell>

      <Cell label="Days to salary" short="Days" note={`until ${salaryOn}`} operator="÷">
        <span className="num text-section text-ink">
          {days}
          <span className="ml-[0.3em] text-label font-normal text-ink-muted max-md:hidden">{days === 1 ? 'day' : 'days'}</span>
        </span>
      </Cell>

      <Cell label="A day from here" short="A day" note="spread evenly" operator="=">
        <Amount value={perDay} role="section" />
      </Cell>
    </dl>
  );
}

function Cell({
  label,
  short,
  note,
  operator,
  className,
  children,
}: {
  label: string;
  /** The phone label - a third of a phone's width holds one word. */
  short: string;
  note: string;
  /** Sits on the rule to the cell's left, reading the three cells as one sum. */
  operator?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('relative min-w-0 border-l border-line px-space-3 pb-space-1 pt-space-3 first:border-l-0 first:pl-0 md:px-space-4 md:py-space-4', className)}>
      {operator && (
        <span
          aria-hidden
          className="absolute -left-[9px] top-1/2 flex h-[18px] w-[18px] -translate-y-1/2 items-center justify-center rounded-full bg-surface text-caption text-ink-muted md:bg-ground"
        >
          {operator}
        </span>
      )}
      <dt className="truncate text-caption text-ink-muted">
        <span className="md:hidden">{short}</span>
        <span className="max-md:hidden">{label}</span>
      </dt>
      <dd className="mt-space-1 truncate">{children}</dd>
      <p className="mt-[2px] truncate text-caption text-ink-muted max-md:hidden">{note}</p>
    </div>
  );
}
