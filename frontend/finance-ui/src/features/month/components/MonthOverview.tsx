import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { CycleBand } from './CycleBand';
import { MonthCrux } from './MonthCrux';
import { CycleInOut } from './CycleInOut';
import { MonthShape } from './MonthShape';
import { formatShortDate } from '@/lib/dates';
import type { PositionResponse } from '@/types/position';
import type { CycleResponse } from '@/types/cycle';
import type { CommitmentInstanceResponse, CommitmentPlanProgressResponse } from '@/types/commitment';

export type CycleMode = 'current' | 'future' | 'past';

interface MonthOverviewProps {
  mode: CycleMode;
  cycle: CycleResponse | undefined;
  cycleLoading: boolean;
  position: PositionResponse | undefined;
  positionLoading: boolean;
  progress: CommitmentPlanProgressResponse | undefined;
  instances: CommitmentInstanceResponse[] | undefined;
}

/**
 * An upcoming month's headline: what's planned into it so far. Every figure is the
 * server's plan progress; the counts are counts.
 *
 * <p>"Free for the rest of this cycle" is deliberately absent. It's held − reserved −
 * committed as of <em>today</em>; for a month that hasn't started, the balances it would
 * be taken from don't exist yet, and borrowing today's would state October's free money
 * with a confidence nobody has.
 */
function PlannedAhead({ cycle, instances }: { cycle: CycleResponse; progress?: CommitmentPlanProgressResponse; instances?: CommitmentInstanceResponse[] }) {
  // Bills only - expected income has its own line in the plan. The month's money figures
  // live in the outline above (comes in − committed − set aside = flexible); a second big
  // "planned" total here disagreed with it, so this block only counts (decision S3).
  const bills = (instances ?? []).filter((i) => i.settleAs !== 'INCOME');
  const unknown = bills.filter((i) => i.expectedAmount == null).length;

  return (
    <div className="flex flex-col gap-space-2">
      <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Planned ahead</span>
      <p className="text-section text-ink">
        {bills.length === 0 ? 'Nothing planned yet' : `${bills.length} ${bills.length === 1 ? 'payment' : 'payments'} planned`}
      </p>
      <p className="max-w-[40rem] text-body text-ink-soft">
        {bills.length === 0
          ? 'Add the bills you expect this month.'
          : unknown > 0
            ? `${unknown} still ${unknown === 1 ? 'needs' : 'need'} an amount - the outline above is an upper limit until then.`
            : 'Every one has an amount.'}
      </p>
      <p className="max-w-[40rem] text-caption text-ink-muted">
        What’s free until salary appears once the month starts on {formatShortDate(cycle.startDate)} - it depends on your
        balances then, which aren’t known yet.
      </p>
    </div>
  );
}

/** A past month's headline: how the plan went - paid against planned, and what was left. */
function HowItWent({ progress, instances }: { progress?: CommitmentPlanProgressResponse; instances?: CommitmentInstanceResponse[] }) {
  const unpaid = (instances ?? []).filter((i) => i.attentionTier !== 'SETTLED' && i.settleAs !== 'INCOME').length;

  return (
    <div className="flex flex-col gap-space-2">
      <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">How the plan went</span>
      {progress ? (
        <>
          <Amount value={progress.settledTotal} role="hero" className="text-ink" />
          <p className="text-body text-ink-soft">
            paid of <Amount value={progress.plannedTotal} role="body" className="text-ink" /> planned ·{' '}
            {progress.settledCount} of {progress.totalCount} {progress.totalCount === 1 ? 'bill' : 'bills'} settled
          </p>
        </>
      ) : (
        <Skeleton className="h-12 w-48" />
      )}
      {unpaid > 0 && (
        <p className="text-caption text-attention">
          {unpaid} left unpaid — listed under “Due date passed” below.
        </p>
      )}
    </div>
  );
}

/**
 * The month at a glance - one panel, adapted to which month it is. Its first line is the
 * month's outline (`MonthShape`): comes in − committed − set aside = flexible.
 *
 * <ul>
 *   <li><strong>This month</strong>: what's free until salary (forward) beside money in and
 *       out so far (back).</li>
 *   <li><strong>Upcoming</strong>: what's planned into it, beside a plain note that nothing
 *       has moved yet - a ₹0 statement for a month that hasn't begun would be true and
 *       meaningless.</li>
 *   <li><strong>Past</strong>: how the plan went, beside what actually came in and went out.</li>
 * </ul>
 */
export function MonthOverview({ mode, cycle, cycleLoading, position, positionLoading, progress, instances }: MonthOverviewProps) {
  return (
    <section aria-label="This cycle at a glance" className="rounded-xl border border-line bg-surface p-space-6">
      <CycleBand cycle={cycle} isLoading={cycleLoading} />

      {/* The month's outline first - what comes in and where it's already going - in every mode. */}
      <div className="mt-space-6 border-t border-line pt-space-6">
        <MonthShape cycle={cycle} />
      </div>

      <div className="mt-space-6 grid grid-cols-1 gap-space-6 border-t border-line pt-space-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-0">
        <div className="lg:pr-space-8">
          {mode === 'current' ? (
            <MonthCrux position={position} cycle={cycle} isLoading={positionLoading} />
          ) : !cycle ? (
            <Skeleton className="h-24 w-full" />
          ) : mode === 'future' ? (
            <PlannedAhead cycle={cycle} progress={progress} instances={instances} />
          ) : (
            <HowItWent progress={progress} instances={instances} />
          )}
        </div>
        <div className="border-t border-line pt-space-6 lg:border-l lg:border-t-0 lg:pl-space-8 lg:pt-0">
          {mode === 'future' && cycle ? (
            <div className="flex flex-col gap-space-2">
              <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Money in and out</span>
              <p className="text-body text-ink-soft">
                Nothing has come in or gone out yet — this month starts on {formatShortDate(cycle.startDate)}.
              </p>
            </div>
          ) : (
            <CycleInOut cycle={cycle} />
          )}
        </div>
      </div>
    </section>
  );
}
