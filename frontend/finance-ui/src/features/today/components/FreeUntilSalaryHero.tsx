import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { UnknownState } from '@/components/UnknownState';
import { Skeleton } from '@/components/Skeleton';
import { PositionBlockers } from '@/features/commitments/components/PositionBlockers';
import { useAnimatedMoney } from '@/lib/useAnimatedMoney';
import { formatSalaryDate, shiftIsoDays } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { useGetCycleForDateQuery } from '@/services/cycleService';
import { useGetCycleStandingQuery } from '@/services/commitmentInstanceService';
import type { PositionResponse } from '@/types/position';
import type { CycleResponse } from '@/types/cycle';
import { PositionStatement } from './PositionStatement';

interface FreeUntilSalaryHeroProps {
  position: PositionResponse | undefined;
  cycle: CycleResponse | undefined;
  isLoading: boolean;
}

/**
 * Today's one hero: **free until salary** - what's in bank and cash, less what's reserved,
 * every bill still due and what's owed on cards (the server's Real Balance). One name for
 * one figure, on Today and Months alike (STRATEGY_DEEP_DIVE §E, decision S3).
 *
 * <p>Beneath it, in words: the per-day share and what's left of today's; then, quietly, the
 * next salary as *expected* - shown, never added in. "How is this worked out?" opens the
 * derivation (held − reserved − still due − owed on cards), each line down to accounts and
 * bills. Every figure is the server's; nothing is computed here.
 */
export function FreeUntilSalaryHero({ position, cycle, isLoading }: FreeUntilSalaryHeroProps) {
  const [open, setOpen] = useState(false);
  const animated = useAnimatedMoney(position?.state === 'OK' ? position.realBalance : null);
  // The month after this one: its expected salary, if a salary rule exists.
  const nextStart = cycle ? shiftIsoDays(cycle.endDate, 1) : null;
  const { data: nextCycle } = useGetCycleForDateQuery(nextStart ?? '', { skip: !nextStart });
  const { data: nextStanding } = useGetCycleStandingQuery(nextCycle?.id ?? 0, { skip: !nextCycle });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
    );
  }

  if (!position || position.state === 'INCOMPLETE') {
    return (
      <div className="flex flex-col gap-space-3">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Free until salary</span>
        <UnknownState reason={position?.reason ?? "We couldn't reach the server."} />
        {position?.state === 'INCOMPLETE' && <PositionBlockers blockers={position.blockers} />}
      </div>
    );
  }

  // Comparisons for tone and wording, not arithmetic on money.
  const negative = Number(position.realBalance) < 0;
  const overToday = Number(position.roomLeft) < 0;
  const salaryOn = cycle ? formatSalaryDate(cycle.endDate) : null;
  const expected = nextStanding && Number(nextStanding.incomeExpectedTotal) > 0 ? nextStanding.incomeExpectedTotal : null;

  return (
    <div className="flex flex-col gap-space-4">
      <div className="flex flex-col gap-space-2">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">
          Free until salary{salaryOn ? ` · ${salaryOn}` : ''}
        </span>
        <Amount value={animated} role="hero" className={negative ? 'text-attention' : 'text-accent'} />
        {negative ? (
          <p className="max-w-[34rem] text-body text-ink-soft">
            More is planned to leave before salary than you hold. Needs you shows where it runs short and what to move.
          </p>
        ) : (
          <p className="num max-w-[34rem] text-body text-ink-soft">
            <Amount value={position.roomToday} role="body" className="text-ink" /> a day until salary · spent today{' '}
            <Amount value={position.spentToday} role="body" className="text-ink" />
            {overToday ? (
              <> · today’s share used - tomorrow’s will be a little smaller</>
            ) : (
              <>
                {' '}
                · <Amount value={position.roomLeft} role="body" className="text-ink" /> left today
              </>
            )}
          </p>
        )}
        {expected && salaryOn && (
          <p className="num text-caption text-ink-muted">
            Then salary: <Amount value={expected} role="caption" signed className="text-positive" /> expected on{' '}
            {salaryOn} - not counted until it arrives.
          </p>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-space-1 rounded-md px-space-1 text-caption text-accent underline-offset-4 hover:underline"
        >
          How is this worked out?
          <ChevronDown size={13} strokeWidth={1.75} aria-hidden className={cn('transition-transform duration-150', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="mt-space-4">
            <PositionStatement position={position} isLoading={false} />
          </div>
        )}
      </div>
    </div>
  );
}
