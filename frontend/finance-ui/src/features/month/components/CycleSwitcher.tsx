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
  /** Shown in the reserved line under the switcher while on the current month ("day 14 of 31"). */
  note?: string;
}

const STEP_BUTTON =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border pointer-coarse:h-11 pointer-coarse:w-11 text-ink-soft transition-colors hover:bg-sunken hover:text-ink active:bg-sunken disabled:opacity-40 max-md:border-0';

/**
 * ‹ October › - the month Months is showing, and the way to move off it.
 *
 * <p>Named for the month, with the real salary-cycle dates beneath, because "October" is
 * how a person thinks about planning while "28 Sep – 27 Oct" is what the figures actually
 * cover. The status word (this month / upcoming / past) sits with the dates so it's never
 * in doubt which kind of view the page below is.
 */
export function CycleSwitcher({ cycle, currentCycle, isCurrent, isFuture, moving, onPrevious, onNext, onCurrent, note }: CycleSwitcherProps) {
  return (
    <div className="flex flex-col gap-space-1">
    <div className="flex flex-wrap items-center gap-space-3 max-md:flex-nowrap max-md:justify-between max-md:rounded-xl max-md:border max-md:border-line max-md:bg-surface max-md:p-space-1">
      <button type="button" onClick={onPrevious} disabled={!cycle || moving} aria-label="Previous month" className={STEP_BUTTON}>
        <ChevronLeft size={18} strokeWidth={1.5} />
      </button>

      <div className="flex min-w-[12rem] flex-col max-md:min-w-0 max-md:items-center max-md:text-center">
        <span className="text-title text-ink">{cycle ? cycleMonthName(cycle.endDate) : ' '}</span>
        <span className="text-caption text-ink-muted">
          {cycle && (
            <>
              {formatShortDate(cycle.startDate)} – {formatShortDate(cycle.endDate)} ·{' '}
              <span className={cn(isCurrent ? 'text-accent' : isFuture ? 'text-invest' : 'text-ink-soft')}>
                {isCurrent ? 'This month' : isFuture ? 'Upcoming' : 'Past'}
              </span>
            </>
          )}
        </span>
      </div>

      <button type="button" onClick={onNext} disabled={!cycle || moving} aria-label="Next month" className={STEP_BUTTON}>
        <ChevronRight size={18} strokeWidth={1.5} />
      </button>

    </div>
      {/* Under the month name, and always taking its line, so switching months never shifts the page. */}
      <div className="h-5 pl-[48px] max-md:pl-0 max-md:text-center">
        {isCurrent && note && <span className="num text-caption text-ink-muted">{note}</span>}
        {!isCurrent && cycle && currentCycle && (
          <button type="button" onClick={onCurrent} className="text-caption text-accent underline-offset-4 hover:underline">
            {isFuture ? '‹' : '›'} Back to {cycleMonthName(currentCycle.endDate)}
            <span className="text-ink-muted"> · the current month</span>
          </button>
        )}
      </div>
    </div>
  );
}
