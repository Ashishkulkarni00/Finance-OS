import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowDownRight, CalendarClock, CreditCard, Landmark } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { DateRule } from '@/components/DateRule';
import { LedgerRow } from '@/components/LedgerRow';
import { Skeleton } from '@/components/Skeleton';
import { useGetProjectionQuery } from '@/services/projectionService';
import { daysBetween } from '@/lib/dates';
import { cn } from '@/lib/cn';
import type { InsightItem } from '@/types/insight';
import type { TimelineItemResponse, TimelineItemType } from '@/types/timeline';

const WEEKDAY = new Intl.DateTimeFormat('en-IN', { weekday: 'long' });

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
  /** Shortfall warnings keyed by row, from `useDatedWarnings`. They only flag the row; the
   *  words and the button live in Needs you. */
  warnings: Map<string, InsightItem>;
}

/** How many payments show before "Show all". Rows that carry a shortfall flag always show. */
const PREVIEW = 5;

/**
 * **Before payday** - everything still to leave, and the salary that ends the stretch, in the
 * Ledger's own shapes (TODAY_HERO_SPEC section 4.5): a date header per day (`DateRule`), then
 * `LedgerRow`s with a kind mark, the name, where it leaves from, and the amount.
 *
 * <p><strong>The window is the cycle</strong>: it runs to the salary row and stops there. The
 * salary is the last line - the finish line, in positive ink, never added to what is free.
 *
 * <p>Date headers carry **no total**: a per-date sum would be client arithmetic. Nothing here is
 * computed; amounts, dates and kinds all arrive from the server.
 */
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

  const shown = expanded ? within : within.filter((it, idx) => idx < PREVIEW || warnings.has(rowKey(it)));
  const hidden = within.length - shown.length;

  // Grouping, not aggregating - the server already sorted by due date.
  const groups: { date: string; rows: TimelineItemResponse[] }[] = [];
  for (const item of shown) {
    const last = groups[groups.length - 1];
    if (last && last.date === item.dueDate) last.rows.push(item);
    else groups.push({ date: item.dueDate, rows: [item] });
  }

  return (
    <>
      <div className="flex flex-col">
        {groups.map((group) => {
          const d = new Date(group.date);
          const payday = salaryDate != null && group.date === salaryDate;
          // Payday is the first day of the *next* month: the salary and whatever falls due with
          // it belong to that month, so it gets its own header that says so (2026-11-11).
          return (
            <div key={group.date} className="flex flex-col">
              <DateRule
                day={d.getDate()}
                line1={payday ? 'Payday' : WEEKDAY.format(d)}
                line2={payday ? `${WEEKDAY.format(d)} · next month starts` : whenLabel(group.date)}
                tone={payday ? 'accent' : daysBetween(group.date) <= 1 ? 'attention' : 'ink'}
              />
              {group.rows.map((item) => (
                <PaymentRow key={rowKey(item)} item={item} flagged={warnings.has(rowKey(item))} />
              ))}
            </div>
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
          className="mt-space-4 block rounded-md text-caption text-accent underline-offset-4 hover:underline"
        >
          {beyond === 1 ? '1 more after payday' : `${beyond} more after payday`} — see the month →
        </Link>
      )}
    </>
  );
}

/** The leading mark: one icon per kind, in the Ledger's 28px tinted square. */
function KindMark({ type, flagged }: { type: TimelineItemType; flagged: boolean }) {
  const Icon = flagged
    ? AlertTriangle
    : type === 'INCOME'
      ? ArrowDownRight
      : type === 'LOAN_EMI'
        ? Landmark
        : type === 'CARD_STATEMENT'
          ? CreditCard
          : CalendarClock;
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md',
        flagged ? 'bg-attention-wash text-attention' : type === 'INCOME' ? 'bg-positive-wash text-positive' : 'bg-sunken text-ink-muted',
      )}
    >
      <Icon size={15} strokeWidth={1.5} />
    </span>
  );
}

/**
 * One payment: what it is, where it leaves from, how much. The mark says the kind, so the
 * line under the name no longer repeats it ("Commitment · from ..."), and it wraps rather
 * than truncating - "from IDBI Saving a..." hid the fact it was there to give.
 *
 * <p>"from" only where it is true. A bill's account is the one it is paid from, but a timeline
 * EMI carries the loan's own account and a card bill carries the card - "from Washing machine
 * EMI" would name the debt as the source of the money that pays it.
 */
function PaymentRow({ item, flagged }: { item: TimelineItemResponse; flagged: boolean }) {
  const income = item.type === 'INCOME';
  const where =
    item.type === 'COMMITMENT' ? `from ${item.accountName}` : income ? `into ${item.accountName}` : item.accountName;
  return (
    <LedgerRow
      to={destinationFor(item)}
      leading={<KindMark type={item.type} flagged={flagged} />}
      primary={item.name}
      richSecondary
      secondary={
        <>
          {where}
          {flagged && <span className="text-attention"> · won’t be covered</span>}
        </>
      }
      amount={
        item.amount != null ? (
          <Amount value={item.amount} role="row" signed={income} className={income ? 'text-positive' : 'text-ink'} />
        ) : (
          <span className="text-caption text-attention">needs an amount</span>
        )
      }
    />
  );
}
