import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { formatShortDate } from '@/lib/dates';
import { UnknownState } from '@/components/UnknownState';
import { PositionBlockers } from '@/features/commitments/components/PositionBlockers';
import type { PositionResponse } from '@/types/position';
import type { CycleResponse } from '@/types/cycle';
import type { CommitmentInstanceResponse, CommitmentPlanProgressResponse } from '@/types/commitment';

export type CycleMode = 'current' | 'future' | 'past';

interface MonthAnswerProps {
  mode: CycleMode;
  cycle: CycleResponse | undefined;
  cycleLoading: boolean;
  position: PositionResponse | undefined;
  positionLoading: boolean;
  progress: CommitmentPlanProgressResponse | undefined;
  instances: CommitmentInstanceResponse[] | undefined;
}

/**
 * The month's answer, in one block (UI_UX_REVAMP_PLAN 4.5). It replaces a four-part card (cycle
 * band, the month's outline, the crux, money in and out): that working is still there, folded
 * under "How the month adds up", but the page now opens on the one question each kind of month
 * asks.
 *
 * <ul>
 *   <li>**This month:** what is still to leave before the next salary, how many commitments are
 *       done, and what is free.</li>
 *   <li>**Upcoming:** what is planned, and whether every payment has an amount.</li>
 *   <li>**Past:** how the plan went.</li>
 * </ul>
 *
 * <p>Every figure is a server field. "Still to pay" is the position's `committed` - **not**
 * planned minus settled, which is a different number (it counts skipped and part-paid items
 * differently; on 2026-11-09 they were 5,100 and 5,594) and must never be derived here.
 */
export function MonthAnswer({ mode, cycle, cycleLoading, position, positionLoading, progress, instances }: MonthAnswerProps) {
  if (cycleLoading || !cycle) return <AnswerSkeleton />;
  if (mode === 'future') return <PlannedAhead cycle={cycle} instances={instances} />;
  if (mode === 'past') return <HowItWent progress={progress} instances={instances} />;
  return <ThisMonth position={position} positionLoading={positionLoading} />;
}

function AnswerSkeleton() {
  return (
    <div className="flex flex-col gap-space-3">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-11 w-44" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="mt-space-3 h-16 w-full" />
    </div>
  );
}

function ThisMonth({ position, positionLoading }: { position: PositionResponse | undefined; positionLoading: boolean }) {
  if (positionLoading || !position) return null;

  if (position.state === 'INCOMPLETE') {
    return (
      <div className="flex flex-col gap-space-3">
        <span className="text-caption text-ink-muted">Still to pay before salary</span>
        <UnknownState reason={position.reason} />
        <PositionBlockers blockers={position.blockers} />
      </div>
    );
  }

  // The month in progress no longer opens on a "Still to pay" block (2026-11-10): Today carries
  // Free until salary and the day count, and Needs you carries what to do. Only the case where the
  // position cannot be worked out is kept - never be confidently silent about a gap.
  return null;
}

function PlannedAhead({ cycle, instances }: { cycle: CycleResponse; instances?: CommitmentInstanceResponse[] }) {
  const bills = (instances ?? []).filter((i) => i.settleAs !== 'INCOME');
  const unknown = bills.filter((i) => i.expectedAmount == null).length;

  return (
    <section className="flex flex-col gap-space-2">
      <span className="text-caption text-ink-muted">Planned ahead</span>
      <p className="text-section text-ink">
        {bills.length === 0 ? 'Nothing planned yet' : `${bills.length} ${bills.length === 1 ? 'payment' : 'payments'} planned`}
      </p>
      <p className="max-w-[34rem] text-body text-ink-soft">
        {bills.length === 0
          ? 'Add the commitments you expect this month.'
          : unknown > 0
            ? `${unknown} still ${unknown === 1 ? 'needs' : 'need'} an amount - the outline is an upper limit until then.`
            : 'Every one has an amount.'}
      </p>
      <p className="max-w-[34rem] text-caption text-ink-muted">
        What’s free until salary appears once the month starts on {formatShortDate(cycle.startDate)} - it depends on your
        balances then, which aren’t known yet.
      </p>
    </section>
  );
}

function HowItWent({ progress, instances }: { progress?: CommitmentPlanProgressResponse; instances?: CommitmentInstanceResponse[] }) {
  const unpaid = (instances ?? []).filter((i) => i.attentionTier !== 'SETTLED' && i.settleAs !== 'INCOME').length;

  return (
    <section className="flex flex-col gap-space-2">
      <span className="text-caption text-ink-muted">How the plan went</span>
      {progress ? (
        <>
          <Amount value={progress.settledTotal} role="hero" className="text-ink" />
          <p className="max-w-[34rem] text-body text-ink-soft">
            paid of <Amount value={progress.plannedTotal} role="body" className="text-ink" /> planned ·{' '}
            {progress.settledCount} of {progress.totalCount} {progress.totalCount === 1 ? 'commitment' : 'commitments'} settled
          </p>
        </>
      ) : (
        <Skeleton className="h-12 w-48" />
      )}
      {unpaid > 0 && <p className="text-caption text-attention">{unpaid} left unpaid — listed under “Due date passed” below.</p>}
    </section>
  );
}
