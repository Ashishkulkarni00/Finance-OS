import { Link } from 'react-router-dom';
import { LedgerRow } from '@/components/LedgerRow';
import { DateBlock } from '@/components/DateBlock';
import { Skeleton } from '@/components/Skeleton';
import { Amount } from '@/components/Amount';
import { daysBetween } from '@/lib/dates';
import { cn } from '@/lib/cn';
import type { TimelineItemResponse, TimelineItemType } from '@/types/timeline';

interface ComingUpListProps {
  items: TimelineItemResponse[] | undefined;
  isLoading: boolean;
  isError?: boolean;
  limit?: number;
}

const WEEKDAY = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });

/** What kind of payment, in words - the three sources look identical otherwise, and "IDBI
 *  EMI" vs a bill vs a card statement changes what you'd do about it. */
const KIND: Record<TimelineItemType, string> = {
  COMMITMENT: 'Commitment',
  LOAN_EMI: 'EMI',
  CARD_STATEMENT: 'Card bill',
  INCOME: 'Coming in',
};

function whenLabel(dueDate: string): { text: string; soon: boolean } {
  const days = daysBetween(dueDate);
  if (days <= 0) return { text: 'Today', soon: true };
  if (days === 1) return { text: 'Tomorrow', soon: true };
  return { text: `In ${days} days`, soon: false };
}

/** Every source has a real destination: a commitment instance, a loan (by its own id), or
 *  a card statement - which has no page of its own yet, so its account does. */
function destinationFor(item: TimelineItemResponse): string {
  if (item.type === 'COMMITMENT' || item.type === 'INCOME') return `/commitments/${item.sourceId}`;
  if (item.type === 'LOAN_EMI') return `/loans/${item.sourceId}`;
  return `/accounts/${item.accountId}`;
}

/**
 * Coming up - the next few payments, and expected income (salary) as money coming in. SCREEN_SPECS S1 hierarchy #4.
 *
 * <p>Rebuilt on the shared `LedgerRow`, the row every register and the Ledger itself
 * use, with the date as a calendar block in the leading slot - the Ledger's day-header
 * treatment, sized for a row. The old row put the date in grey caption text under the
 * name, which made "when" the least visible fact on a list whose entire purpose is
 * *when*. It also never said which account the money leaves from, which is exactly what
 * you need to know to check there's enough in it.
 */
export function ComingUpList({ items, isLoading, isError, limit = 3 }: ComingUpListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-caption text-ink-muted">We couldn’t load what’s coming up. Refresh to try again.</p>;
  }

  if (!items || items.length === 0) {
    return <p className="text-body text-ink-soft">Nothing due in the next 30 days.</p>;
  }

  const visible = items.slice(0, limit);

  return (
    <div className="flex flex-col">
      {visible.map((item, i) => {
        const date = new Date(item.dueDate);
        const when = whenLabel(item.dueDate);
        return (
          <LedgerRow
            key={`${item.type}-${item.sourceId}-${item.dueDate}`}
            // Capped: past a few rows the stagger stops reading as one list arriving and
            // starts reading as a queue the user is waiting on.
            revealDelay={Math.min(i, 5) * 45}
            to={destinationFor(item)}
            leading={<DateBlock date={item.dueDate} tone={when.soon ? 'soon' : 'neutral'} />}
            primary={item.name}
            // "from" only where it's true. A bill's account is the one it's paid from, but
            // a timeline EMI carries the loan's own account and a card bill carries the
            // card - "EMI · from Washing machine EMI" would name the debt as the source of
            // the money that pays it.
            secondary={
              item.type === 'COMMITMENT'
                ? `${KIND[item.type]} · from ${item.accountName}`
                : item.type === 'INCOME'
                  ? `${KIND[item.type]} · into ${item.accountName}`
                  : `${KIND[item.type]} · ${item.accountName}`
            }
            meta={
              <span className={cn('whitespace-nowrap', when.soon ? 'text-attention' : 'text-ink-muted')}>
                {when.text}
                <span className="text-ink-muted"> · {WEEKDAY.format(date)}</span>
              </span>
            }
            amount={
              item.amount != null ? (
                item.type === 'INCOME' ? (
                  // Expected, not received: shown as money in, never added to what's free.
                  <Amount value={item.amount} role="row" signed className="text-positive" />
                ) : (
                  <Amount value={item.amount} role="row" className="text-ink" />
                )
              ) : (
                <span className="text-caption text-attention">Amount unknown</span>
              )
            }
          />
        );
      })}
      {items.length > limit && (
        <Link
          to="/month"
          className="mt-space-2 self-start rounded-md text-caption text-accent underline-offset-4 hover:underline"
        >
          See all {items.length} on Months →
        </Link>
      )}
    </div>
  );
}
