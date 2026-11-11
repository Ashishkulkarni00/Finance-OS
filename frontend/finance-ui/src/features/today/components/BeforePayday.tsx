import { Fragment, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { useInsightAction } from '@/components/InsightList';
import { useGetProjectionQuery } from '@/services/projectionService';
import { daysBetween } from '@/lib/dates';
import { cn } from '@/lib/cn';
import type { InsightItem } from '@/types/insight';
import type { TimelineItemResponse, TimelineItemType } from '@/types/timeline';

/** What kind of payment, in words - the four sources look identical otherwise, and "IDBI
 *  EMI" vs a bill vs a card statement changes what you would do about it. */
const KIND: Record<TimelineItemType, string> = {
  COMMITMENT: 'Commitment',
  LOAN_EMI: 'EMI',
  CARD_STATEMENT: 'Card bill',
  INCOME: 'Coming in',
};

const DAY = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

/** Every source has a real destination: a commitment instance, a loan (by its own id), or
 *  a card statement - which has no page of its own yet, so its account does. */
function destinationFor(item: TimelineItemResponse): string {
  if (item.type === 'COMMITMENT' || item.type === 'INCOME') return `/commitments/${item.sourceId}`;
  if (item.type === 'LOAN_EMI') return `/loans/${item.sourceId}`;
  return `/accounts/${item.accountId}`;
}

function rowKey(item: TimelineItemResponse): string {
  return `${item.type}-${item.sourceId}-${item.dueDate}`;
}

function whenLabel(dueDate: string): string {
  const days = daysBetween(dueDate);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

/**
 * Pairs a dated shortfall warning with the exact payment that breaks the account.
 *
 * <p>The insight engine already knows that IDBI will not cover the Coding Ninjas EMI on
 * 5 Nov, and words it better than this file could. What it could not do was say *where*:
 * the warning sat in a card beside a list of payments, one of which was the payment it
 * named, and neither knew about the other.
 *
 * <p><strong>Account and date are not enough to find the row</strong>, and the first
 * attempt at this got it wrong on the user's own data: three IDBI bills fall on 5 Nov and
 * the account still covers the first two. `ShortfallRule` picks the first deduction whose
 * `covered` is false, so the only honest way to find the same payment is to read the same
 * projection it read - `commitmentInstanceId` there is the timeline row's `sourceId` here.
 * Nothing is parsed out of the warning's wording and nothing is recomputed.
 *
 * <p><strong>One projection is fetched, for the first shortfall account.</strong> Hooks
 * cannot be called in a loop, and a second shortfall is rare enough that the honest trade
 * is to leave it as a card in Needs you rather than build a fan-out for it. Nothing is
 * lost either way - only the inline placement is.
 *
 * <p>While the projection is in flight the warning anchors to that account's first payment
 * on the date, so it is never missing from the page; it moves to the exact row when the
 * projection lands. `consumed` is the keys that found a row, and only those are hidden
 * from the Needs-you list - a shortfall with nowhere to land keeps its card, because the
 * alternative is a warning that silently disappears.
 */
export function useDatedWarnings(
  items: TimelineItemResponse[] | undefined,
  insights: InsightItem[] | undefined,
): { byRow: Map<string, InsightItem>; consumed: string[] } {
  const primary = insights?.find(
    (i) => i.type === 'SHORTFALL' && i.when != null && i.action?.toAccountId != null,
  );
  const accountId = primary?.action?.toAccountId;
  const { data: projection } = useGetProjectionQuery(accountId ?? 0, { skip: accountId == null });

  return useMemo(() => {
    const byRow = new Map<string, InsightItem>();
    const consumed: string[] = [];
    if (!items || !primary || accountId == null) return { byRow, consumed };

    // The payment the account cannot cover - the same one `ShortfallRule` named.
    const breaks = projection?.accountId === accountId
      ? projection.deductions.find((d) => d.covered === false)
      : undefined;

    const exact = breaks
      ? items.find((i) => i.type === 'COMMITMENT' && i.sourceId === breaks.commitmentInstanceId)
      : undefined;
    const anchor = exact ?? items.find((i) => i.accountId === accountId && i.dueDate === primary.when);
    if (!anchor) return { byRow, consumed };

    byRow.set(rowKey(anchor), primary);
    consumed.push(primary.key);
    return { byRow, consumed };
  }, [items, primary, accountId, projection]);
}

interface BeforePaydayProps {
  items: TimelineItemResponse[] | undefined;
  isLoading: boolean;
  isError?: boolean;
  /** Payday itself - the cycle's last day plus one. Everything up to and including it is
   *  "before payday"; anything after belongs to a month this screen is not about. */
  salaryDate: string | null;
  /** Shortfall warnings keyed by row, from `useDatedWarnings`. */
  warnings: Map<string, InsightItem>;
}

/**
 * **Before payday** - everything still to leave, and the salary that ends the stretch.
 *
 * <p>Replaces `ComingUpList`, which showed three of sixteen rows, truncated every name
 * ("Bike loan EMI (H..."), and stopped at an arbitrary count that had nothing to do with
 * the cycle. Three rows all reading "5 Nov · in 4 days" is not a timeline - it is the top
 * of a list, and the user said as much: *"coming up needs revamping"*.
 *
 * <p><strong>The window is the cycle, not a round number of days.</strong> This product's
 * month runs salary date to salary date, and the only question this list answers is "what
 * stands between me and payday". So it runs to the salary row and stops there, with the
 * salary itself as the last line - the finish line, in positive ink, never added to what
 * is free.
 *
 * <p><strong>Dates are headers, not a column repeated down every row.</strong> Four
 * payments on 5 Nov used to print "5 NOV" four times in a calendar leaf and "In 4 days ·
 * Thu" four times beside them. Once per date, spanning the measure, leaves the rows
 * carrying only what differs: name, account, amount.
 *
 * <p><strong>A shortfall is attached to the payment it breaks.</strong> See
 * `useDatedWarnings` - the fact belongs on the row, and so does the button that fixes it.
 *
 * <p>One grid governs every row (`display: contents`), so amounts stack in a single
 * right-aligned column across all date groups. Nothing here is computed: amounts, dates
 * and the warning's own wording all arrive from the server.
 */
/** How many payments show before "Show all". Rows that carry a shortfall warning always show. */
const PREVIEW = 5;

export function BeforePayday({ items, isLoading, isError, salaryDate, warnings }: BeforePaydayProps) {
  const [expanded, setExpanded] = useState(false);
  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-caption text-ink-muted">We couldn’t load what’s due before payday. Refresh to try again.</p>;
  }

  if (!items || items.length === 0) {
    return <p className="text-body text-ink-soft">Nothing due between now and your next salary.</p>;
  }

  // A comparison, not arithmetic. `salaryDate` is null only while the cycle is still
  // loading, and showing the unbounded list for a moment is better than showing nothing.
  const within = salaryDate ? items.filter((i) => i.dueDate <= salaryDate) : items;
  const beyond = items.length - within.length;

  if (within.length === 0) {
    return <p className="text-body text-ink-soft">Nothing due between now and your next salary.</p>;
  }

  // Grouping, not aggregating - the server already sorted by due date, so equal dates are
  // adjacent and this only walks them. No subtotal per day: that would be arithmetic.
  const shown = expanded ? within : within.filter((it, idx) => idx < PREVIEW || warnings.has(rowKey(it)));
  const hidden = within.length - shown.length;

  const groups: { date: string; rows: TimelineItemResponse[] }[] = [];
  for (const item of shown) {
    const last = groups[groups.length - 1];
    if (last && last.date === item.dueDate) last.rows.push(item);
    else groups.push({ date: item.dueDate, rows: [item] });
  }

  let index = 0;

  return (
    <>
      <div className="grid w-full" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
        {groups.map((group) => {
          const soon = daysBetween(group.date) <= 1;
          // Payday is the first day of the *next* month: the salary and whatever falls due with
          // it belong to that month, not this one. Under a plain date header they read as this
          // month's last bills (2026-11-11), so payday gets a band that says so.
          if (salaryDate && group.date === salaryDate) {
            return (
              <Fragment key={group.date}>
                <div
                  style={{ gridColumn: '1 / -1' }}
                  className="mb-space-2 mt-space-5 flex items-baseline justify-between gap-space-3 rounded-lg bg-sunken px-space-3 py-space-2 first:mt-0"
                >
                  <span className="text-caption font-semibold text-ink">
                    Payday · {DAY.format(new Date(group.date))}
                  </span>
                  <span className="text-caption text-ink-muted">next month starts · {whenLabel(group.date)}</span>
                </div>
                {group.rows.map((item) => {
                  const warning = warnings.get(rowKey(item));
                  index += 1;
                  return (
                    <PaymentRow
                      key={rowKey(item)}
                      item={item}
                      warning={warning}
                      last={index === shown.length}
                      revealDelay={Math.min(index, 8) * 35}
                    />
                  );
                })}
              </Fragment>
            );
          }
          return (
            <Fragment key={group.date}>
              <div
                style={{ gridColumn: '1 / -1' }}
                className="flex items-baseline gap-space-3 pb-space-2 pt-space-5 first:pt-0"
              >
                <span className={cn('text-caption', soon ? 'text-attention' : 'text-ink')}>
                  {DAY.format(new Date(group.date))}
                </span>
                <span className="text-caption text-ink-muted">{whenLabel(group.date)}</span>
                {/* No trailing rule: the user found the line after "tomorrow" stray (2026-11-09) -
                    the date in caps already marks the group. */}
              </div>

              {group.rows.map((item) => {
                const warning = warnings.get(rowKey(item));
                index += 1;
                return (
                  <PaymentRow
                    key={rowKey(item)}
                    item={item}
                    warning={warning}
                    last={index === shown.length}
                    revealDelay={Math.min(index, 8) * 35}
                  />
                );
              })}
            </Fragment>
          );
        })}
      </div>

      {(hidden > 0 || (expanded && within.length > PREVIEW)) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-space-3 inline-block rounded-md text-caption text-accent underline-offset-4 hover:underline"
        >
          {expanded ? 'Show fewer' : `Show all ${within.length} →`}
        </button>
      )}

      {beyond > 0 && (
        <Link
          to="/month"
          className="mt-space-4 inline-block rounded-md text-caption text-accent underline-offset-4 hover:underline"
        >
          {beyond === 1 ? '1 more after payday' : `${beyond} more after payday`} — see the month →
        </Link>
      )}
    </>
  );
}

/**
 * One payment: what it is, where it leaves from, how much.
 *
 * <p>`display: contents` so the parent grid owns the columns - that is what makes the
 * amounts stack across every date group rather than each group aligning itself. The name
 * is the link rather than the whole row: a register row you can click anywhere is right
 * where reading the list *is* the job, and wrong on a page where a stray tap would throw
 * the reader off the screen they came to read.
 */
function PaymentRow({
  item,
  warning,
  last,
  revealDelay,
}: {
  item: TimelineItemResponse;
  warning?: InsightItem;
  /** The final row draws no rule: on a phone it sits on the card's own edge. */
  last: boolean;
  revealDelay: number;
}) {
  const style = { '--reveal-delay': `${revealDelay}ms` } as CSSProperties;
  const income = item.type === 'INCOME';
  const cell = cn('reveal py-space-2', !warning && !last && 'border-b border-line', last && 'max-md:pb-0');

  return (
    <div className="contents">
      <div className={cn(cell, 'min-w-0 pr-space-5')} style={style}>
        <Link
          to={destinationFor(item)}
          className="block truncate text-row text-ink underline-offset-4 hover:underline"
        >
          {item.name}
        </Link>
        <span className="block truncate text-caption text-ink-muted">
          {/* "from" only where it is true. A bill's account is the one it is paid from, but
              a timeline EMI carries the loan's own account and a card bill carries the card
              - "EMI · from Washing machine EMI" would name the debt as the source of the
              money that pays it. */}
          {item.type === 'COMMITMENT'
            ? `${KIND[item.type]} · from ${item.accountName}`
            : income
              ? `${KIND[item.type]} · into ${item.accountName}`
              : `${KIND[item.type]} · ${item.accountName}`}
        </span>
      </div>

      <div className={cn(cell, 'text-right tabular-nums')} style={style}>
        {item.amount != null ? (
          <Amount value={item.amount} role="row" signed={income} className={income ? 'text-positive' : 'text-ink'} />
        ) : (
          <span className="text-caption text-attention">Amount unknown</span>
        )}
      </div>

      {warning && <ShortfallNote warning={warning} />}
    </div>
  );
}

/**
 * The shortfall, under the payment it breaks, in the server's own words.
 *
 * <p>Spans both columns and carries the row's bottom rule, so the note reads as part of
 * the payment rather than as a card that happens to sit near it. Amber, not red: red is
 * for money already lost, and this is money that can still be moved - which is exactly
 * what the button does.
 */
function ShortfallNote({ warning }: { warning: InsightItem }) {
  const { act, busy } = useInsightAction(warning);
  return (
    <div
      style={{
        gridColumn: '1 / -1',
        backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))',
      }}
      className="mb-space-2 flex items-start gap-space-2 rounded-lg border-b border-line px-space-3 py-space-3"
    >
      <AlertTriangle size={15} strokeWidth={1.5} className="mt-[0.15rem] shrink-0 text-attention" aria-hidden />
      <div className="flex min-w-0 flex-col gap-space-1">
        <p className="text-label text-ink">{warning.title}</p>
        <p className="text-caption text-ink-soft">{warning.explanation}</p>
        {warning.action && (
          <div className="mt-space-1">
            <Button size="sm" variant="secondary" disabled={busy} onClick={act}>
              {warning.action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
