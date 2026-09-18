import { Amount } from '@/components/Amount';
import { UnknownState } from '@/components/UnknownState';
import { Skeleton } from '@/components/Skeleton';
import { PositionBlockers } from '@/features/commitments/components/PositionBlockers';
import { useAnimatedMoney } from '@/lib/useAnimatedMoney';
import { formatMoney } from '@/lib/money';
import { cycleProgress, formatSalaryDate } from '@/lib/dates';
import type { PositionResponse } from '@/types/position';
import type { CycleResponse } from '@/types/cycle';

interface MonthCruxProps {
  position: PositionResponse | undefined;
  cycle: CycleResponse | undefined;
  isLoading: boolean;
}

/**
 * Zone 2 - the screen's one hero, forward-looking rather than a report of the past.
 * "You spent ₹36,043" can't answer "how's my month going" without knowing what's still
 * to come; Real Balance already is the cycle's free money, just reframed in cycle
 * terms rather than Today's per-day terms. MONTH_EXPERIENCE.md §4, §12.
 *
 * <p>Now states where the figure comes from, the way Today's hero does. The same number
 * appears on both screens under different names ("Free for the rest of this cycle" here,
 * "Real balance" on Today) and nothing said they were one figure. Every sentence only
 * names facts already on the position/cycle responses - no money is computed here.
 */
export function MonthCrux({ position, cycle, isLoading }: MonthCruxProps) {
  const animated = useAnimatedMoney(position?.state === 'OK' ? position.realBalance : undefined);

  if (isLoading || !position || !cycle) {
    return (
      <div className="flex flex-col gap-space-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
    );
  }

  if (position.state === 'INCOMPLETE') {
    return (
      <div className="flex flex-col gap-space-3">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Free for the rest of this cycle</span>
        <UnknownState reason={position.reason} />
        <PositionBlockers blockers={position.blockers} />
      </div>
    );
  }

  const { dayOfCycle, daysRemaining, ended } = cycleProgress(cycle.startDate, cycle.endDate);
  // A comparison for tone, not arithmetic on money.
  const negative = Number(position.realBalance) < 0;

  let verdict: string;
  if (ended) {
    verdict = 'This cycle has ended — close it below to lock in what happened.';
  } else if (dayOfCycle <= 2) {
    verdict = `${formatMoney(position.breakdown.committed)} is committed this cycle.`;
  } else if (negative) {
    verdict = "Tight — you're projected short before the cycle ends unless something changes.";
  } else {
    verdict = `On track for the next ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}.`;
  }

  return (
    <div className="flex flex-col gap-space-2">
      <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Free for the rest of this cycle</span>
      <Amount value={animated} role="hero" className={negative ? undefined : 'text-accent'} emphasiseNegative />
      <p className="max-w-[40rem] text-body text-ink-soft">{verdict}</p>
      <p className="max-w-[40rem] text-caption text-ink-muted">
        What’s in your bank and cash, minus what you’ve reserved and every bill still due before salary on{' '}
        {formatSalaryDate(cycle.endDate)}. Today splits this same figure into a share for each day.
      </p>
    </div>
  );
}
