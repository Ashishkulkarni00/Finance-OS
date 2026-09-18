import { Skeleton } from '@/components/Skeleton';
import { ProgressRule } from '@/components/ProgressRule';
import { cycleProgress, daysBetween } from '@/lib/dates';
import type { CycleResponse } from '@/types/cycle';

interface CycleBandProps {
  cycle: CycleResponse | undefined;
  isLoading: boolean;
}

const SHORT_DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

/**
 * Zone 1 - establishes "now" in one line. Not a feature, a rule with a marker.
 * MONTH_TAB_UX_SPEC.md §2.
 */
export function CycleBand({ cycle, isLoading }: CycleBandProps) {
  if (isLoading || !cycle) {
    return <Skeleton className="h-10 w-full" />;
  }

  const { fraction, daysRemaining, dayOfCycle, totalDays, ended, upcoming } = cycleProgress(cycle.startDate, cycle.endDate);
  // A planned month: count down to its start rather than claiming "day 1 of 30" for a
  // cycle that hasn't begun.
  const untilStart = daysBetween(cycle.startDate);
  const caption = upcoming
    ? `Starts in ${untilStart} ${untilStart === 1 ? 'day' : 'days'}`
    : ended
    ? 'This cycle has ended'
    : daysRemaining <= 3
      ? `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} to salary`
      : `day ${dayOfCycle} of ${totalDays} · ${daysRemaining} days to salary`;

  return (
    <div className="flex flex-col gap-space-2" role="img" aria-label={`Cycle from ${cycle.startDate} to ${cycle.endDate}, ${caption}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-caption text-ink-muted">{SHORT_DATE.format(new Date(cycle.startDate))}</span>
        <span className="text-caption text-ink-muted">{SHORT_DATE.format(new Date(cycle.endDate))}</span>
      </div>
      <ProgressRule fraction={fraction} />
      <span className={`num text-caption ${daysRemaining <= 3 && !ended ? 'text-attention' : 'text-ink-muted'}`}>{caption}</span>
    </div>
  );
}
