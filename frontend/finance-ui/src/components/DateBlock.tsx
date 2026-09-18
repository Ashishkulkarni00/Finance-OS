import { cn } from '@/lib/cn';

const MONTH = new Intl.DateTimeFormat('en-IN', { month: 'short' });

interface DateBlockProps {
  /** `YYYY-MM-DD`. */
  date: string;
  /** `soon` and `overdue` are amber - attention, never critical red (SCREEN_SPECS S1). */
  tone?: 'neutral' | 'soon' | 'overdue';
}

/**
 * A due date as a small calendar leaf - the day as a figure, the month beneath it.
 *
 * <p>For lists whose whole purpose is *when*: Today's Coming up and the Months page's plan.
 * Both used to put the date in grey caption text under the name, which made the one fact
 * the list exists for the least visible thing in each row. Decorative to assistive tech
 * (the row's own text already states the date), hence `aria-hidden`.
 */
export function DateBlock({ date, tone = 'neutral' }: DateBlockProps) {
  const d = new Date(date);
  return (
    <span
      aria-hidden
      className={cn(
        'flex w-10 shrink-0 flex-col items-center rounded-md py-space-1 leading-none',
        tone === 'neutral' ? 'bg-sunken text-ink' : 'bg-attention/10 text-attention',
        tone === 'overdue' && 'ring-1 ring-attention/40',
      )}
    >
      <span className="num text-row leading-none">{d.getDate()}</span>
      <span className="mt-[2px] text-micro uppercase tracking-[0.04em] opacity-80">{MONTH.format(d)}</span>
    </span>
  );
}
