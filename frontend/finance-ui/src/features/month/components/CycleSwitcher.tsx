import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cycleMonthName, formatShortDate } from '@/lib/dates';
import { cn } from '@/lib/cn';
import type { CycleResponse } from '@/types/cycle';

interface CycleSwitcherProps {
  cycle: CycleResponse | undefined;
  /** The month salary is currently running in - named on the way back to it. */
  currentCycle: CycleResponse | undefined;
  isCurrent: boolean;
  isFuture: boolean;
  moving: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onCurrent: () => void;
  /** Only on the current month: the day count ("day 15 of 31"), said on the status line. */
  note?: string;
  /** After the step buttons on the title row - the page's help button. */
  trailing?: ReactNode;
}

const STEP_BUTTON =
  'flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-ink-soft transition-colors hover:bg-sunken hover:text-ink active:bg-sunken disabled:opacity-40 pointer-coarse:size-11';

/**
 * **The page's header.** On Month the title *is* the month being shown: "November", in the same
 * type as every other page's title, with the two step buttons (and the help button) on its row and
 * one line under it that says everything else - the real salary-cycle dates, what kind of month
 * this is, the day count, and (off the current month) the way back.
 *
 * <p>It used to be a "Month" title with a second, smaller "November" row beneath it. The word
 * "Month" told the reader nothing the bottom bar hadn't, and the name they came for sat a row below
 * where the eye lands (2026-11-11). The `<h1>` is read as "Month: November" for assistive tech, and
 * says plain "Month" while the cycle is still loading so the page never has an empty title.
 *
 * <p>Named for the month, with the dates beneath, because "November" is how a person thinks about
 * planning while "28 Oct – 27 Nov" is what the figures actually cover. The status line always takes
 * its height, so stepping never shifts the page.
 */
export function CycleSwitcher({ cycle, currentCycle, isCurrent, isFuture, moving, onPrevious, onNext, onCurrent, note, trailing }: CycleSwitcherProps) {
  return (
    <header className="flex flex-col gap-space-1">
      <div className="flex items-center justify-between gap-space-3">
        {/* aria-live: stepping changes this text without moving focus, so say it. */}
        <h1 aria-live="polite" className={cn('truncate text-page text-ink transition-opacity duration-150', moving && 'opacity-50')}>
          {cycle ? (
            <>
              <span className="sr-only">Month: </span>
              {cycleMonthName(cycle.endDate)}
            </>
          ) : (
            'Month'
          )}
        </h1>
        <div className="flex shrink-0 items-center gap-space-2">
          <button type="button" onClick={onPrevious} disabled={!cycle || moving} aria-label="Previous month" className={STEP_BUTTON}>
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button type="button" onClick={onNext} disabled={!cycle || moving} aria-label="Next month" className={STEP_BUTTON}>
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
          {trailing}
        </div>
      </div>

      <div className="flex min-h-5 items-baseline justify-between gap-space-3 text-caption">
        <span className="num min-w-0 text-ink-muted">
          {cycle && (
            <>
              {formatShortDate(cycle.startDate)} – {formatShortDate(cycle.endDate)} ·{' '}
              <span className={cn(isCurrent ? 'text-accent' : isFuture ? 'text-invest' : 'text-ink-soft')}>
                {isCurrent ? 'This month' : isFuture ? 'Upcoming' : 'Past'}
              </span>
              {isCurrent && note && <> · {note}</>}
            </>
          )}
        </span>
        {!isCurrent && cycle && currentCycle && (
          <button type="button" onClick={onCurrent} className="shrink-0 text-accent underline-offset-4 hover:underline">
            {isFuture ? '‹ ' : ''}Back to {cycleMonthName(currentCycle.endDate)}{isFuture ? '' : ' ›'}
          </button>
        )}
      </div>
    </header>
  );
}
