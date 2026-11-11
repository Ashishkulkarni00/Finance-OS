import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type DateRuleTone = 'ink' | 'accent' | 'attention';

const NUMERAL: Record<DateRuleTone, string> = { ink: 'text-ink', accent: 'text-accent', attention: 'text-attention' };

/**
 * A date group's header: the day of the month as a numeral, two lines of words beside it, and
 * a hairline running out to an optional trailing figure. Shared by the Ledger's `DayGroup` and
 * Today's "Before payday", so a date reads the same on both.
 *
 * <p>`sticky` is for long lists inside `<main>` (the Ledger); the caller opts in.
 */
export function DateRule({
  day,
  line1,
  line2,
  tone = 'ink',
  trailing,
  sticky = false,
}: {
  day: number;
  line1: string;
  line2?: string;
  tone?: DateRuleTone;
  trailing?: ReactNode;
  sticky?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-space-3 pb-space-2 pt-space-3',
        sticky && 'sticky top-0 z-10 -mx-space-2 mb-space-1 bg-ground px-space-2',
      )}
    >
      <span className={cn('num shrink-0 text-section leading-none', NUMERAL[tone])} aria-hidden>
        {day}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn('truncate text-label', tone === 'ink' ? 'text-ink' : NUMERAL[tone])}>{line1}</span>
        {line2 && <span className="truncate text-caption text-ink-muted">{line2}</span>}
      </span>
      <span aria-hidden className={cn('h-px flex-1', tone === 'accent' ? 'bg-accent/30' : 'bg-line')} />
      {trailing}
    </div>
  );
}
