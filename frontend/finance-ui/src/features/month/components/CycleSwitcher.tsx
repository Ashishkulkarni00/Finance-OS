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
}

const STEP_BUTTON =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-sunken hover:text-ink disabled:opacity-40';

/**
 * ‹ October › - the month Months is showing, and the way to move off it.
 *
 * <p>Named for the month, with the real salary-cycle dates beneath, because "October" is
 * how a person thinks about planning while "28 Sep – 27 Oct" is what the figures actually
 * cover. The status word (this month / upcoming / past) sits with the dates so it's never
 * in doubt which kind of view the page below is.
 */
export function CycleSwitcher({ cycle, currentCycle, isCurrent, isFuture, moving, onPrevious, onNext, onCurrent }: CycleSwitcherProps) {
  return (
    <div className="flex flex-col gap-space-1">
    <div className="flex flex-wrap items-center gap-space-3">
      <button type="button" onClick={onPrevious} disabled={!cycle || moving} aria-label="Previous month" className={STEP_BUTTON}>
        <ChevronLeft size={18} strokeWidth={1.75} />
      </button>

      <div className="flex min-w-[12rem] flex-col">
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
        <ChevronRight size={18} strokeWidth={1.75} />
      </button>

    </div>
      {/* Under the month name, and always taking its line, so switching months never shifts the page. */}
      <div className="h-5 pl-[48px]">
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
