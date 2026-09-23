import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import { useGetCycleSnapshotQuery } from '@/services/cycleService';
import { PlanChanges } from './PlanChanges';
import { PlanDecisions } from './PlanDecisions';
import type { CycleMode } from './MonthOverview';
import type { CycleResponse } from '@/types/cycle';
import type { CommitmentPlanProgressResponse } from '@/types/commitment';

type TabId = 'different' | 'changed' | 'kept';

const TABS: { id: TabId; label: string }[] = [
  { id: 'different', label: 'What’s different' },
  { id: 'changed', label: 'What you changed' },
  { id: 'kept', label: 'Commitments kept' },
];

interface MonthBriefingProps {
  cycle: CycleResponse | undefined;
  mode: CycleMode;
  progress: CommitmentPlanProgressResponse | undefined;
}

/**
 * The three questions about the *shape* of a month, directly under its numbers: why this
 * month differs from the last, what you decided during it, and whether you kept to it.
 *
 * <p>Tabs rather than three stacked cards, matching Money's register strip: these are
 * alternatives, not a sequence - you come to check one of them, and stacking three mostly
 * empty boxes above the plan pushes the actual work off the screen.
 *
 * <p>Unlike Money's tabs these are local state, not routes. A route would fight the
 * `?cycle=` parameter that holds which month is being viewed, and which tab you last
 * looked at is not worth a URL.
 *
 * <p><strong>Every tab always renders something</strong>, including "nothing to show yet".
 * A tab you can click that then displays nothing reads as a bug.
 */
export function MonthBriefing({ cycle, mode, progress }: MonthBriefingProps) {
  const [active, setActive] = useState<TabId>('different');

  return (
    <section className="flex flex-col gap-space-4">
      {/* The strip's own bottom border is this section's rule. A `Divided` wrapper above it
          would stack a second hairline two pixels away, which reads as a mistake. */}
      <nav aria-label="About this month" role="tablist" className="flex gap-space-1 border-b border-line">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`month-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`month-panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={cn(
              '-mb-px border-b-2 px-space-3 py-space-2 text-label transition-colors duration-150',
              active === tab.id
                ? 'border-accent font-medium text-accent'
                : 'border-transparent text-ink-soft hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div role="tabpanel" id={`month-panel-${active}`} aria-labelledby={`month-tab-${active}`}>
        {active === 'different' && (
          <PlanChanges
            cycle={cycle}
            chrome="rows"
            emptyNote="Nothing starts, stops or changes amount this month — it runs like the one before."
          />
        )}
        {active === 'changed' && (
          <PlanDecisions
            cycle={cycle}
            heading={false}
            emptyNote="You haven’t changed anything in your plan this month. Edits to a bill or a goal are recorded here, with what each one costs per month."
          />
        )}
        {active === 'kept' && <KeptPanel cycle={cycle} mode={mode} progress={progress} />}
      </div>
    </section>
  );
}

/**
 * How many of the month's commitments were actually kept.
 *
 * <p>Two different facts depending on the month, and they are deliberately worded
 * differently. A <strong>closed</strong> cycle reads its snapshot: a frozen, permanent
 * record of how that month went. An <strong>open</strong> one reads live plan progress,
 * which is a running count that can still change - calling that "kept" would claim the
 * month is over.
 */
function KeptPanel({ cycle, mode, progress }: MonthBriefingProps) {
  // Only a closed cycle has a snapshot; asking for one otherwise is a guaranteed 404.
  const { data: snapshot } = useGetCycleSnapshotQuery(cycle?.id ?? 0, { skip: !cycle?.closed });

  if (mode === 'future') {
    return <Note>This month hasn’t started yet, so nothing has been paid in it.</Note>;
  }

  if (cycle?.closed) {
    if (snapshot?.commitmentsKept == null || snapshot.commitmentsPlanned == null) {
      return (
        <Note>
          This month closed before the app started recording it. There’s no honest count to show - it isn’t zero, it
          simply wasn’t kept track of. Months closed from now on will have one.
        </Note>
      );
    }
    const { commitmentsKept: kept, commitmentsPlanned: planned } = snapshot;
    return (
      <div className="flex flex-col gap-space-3">
        <Figure value={`${kept} of ${planned}`} label="Kept" positive={kept === planned} />
        <p className="text-caption text-ink-muted">
          Paid, or already settled in an earlier month. This is the permanent record written when the month closed.
        </p>
        <PlannedVsActual snapshot={snapshot} />
      </div>
    );
  }

  if (!progress || progress.totalCount === 0) {
    return <Note>There are no commitments in this month yet.</Note>;
  }

  return (
    <div className="flex flex-col gap-space-3">
      <Figure
        value={`${progress.settledCount} of ${progress.totalCount}`}
        label="Settled so far"
        positive={progress.settledCount === progress.totalCount}
      />
      <p className="text-caption text-ink-muted">
        {progress.settledCount === progress.totalCount
          ? 'Everything in this month’s plan is dealt with. The count is fixed permanently when you close the month.'
          : `${progress.upcomingCount + progress.needsYouCount} still to go, ${formatMoney(progress.upcomingTotal)} of it outstanding. The final count is written when you close the month.`}
      </p>
    </div>
  );
}

/** Planned versus actual committed spend - the same question in rupees. */
function PlannedVsActual({
  snapshot,
}: {
  snapshot: { plannedCommittedTotal: string | null; actualCommittedTotal: string | null };
}) {
  const { plannedCommittedTotal: planned, actualCommittedTotal: actual } = snapshot;
  if (actual == null) return null;

  if (planned == null) {
    return (
      <p className="text-caption text-ink-muted">
        Commitments cost {formatMoney(actual)}. One of them had no set amount, so there’s no planned total to compare.
      </p>
    );
  }
  // Comparison only, to choose a word. The gap itself is never computed here - the
  // frontend does no money arithmetic (FRONTEND_CONVENTIONS §4 rule 2).
  const a = Number(actual);
  const p = Number(planned);
  const verdict = a === p ? 'exactly to plan' : a > p ? 'more than planned' : 'less than planned';
  return (
    <p className="text-caption text-ink-muted">
      Commitments: planned {formatMoney(planned)} · actual {formatMoney(actual)} — {verdict}.
    </p>
  );
}

/** A count set like every other headline figure - `num` for tabular digits. */
function Figure({ value, label, positive }: { value: string; label: string; positive: boolean }) {
  return (
    <div className="flex flex-col items-start gap-space-2">
      <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">{label}</span>
      <span className={cn('num text-hero', positive ? 'text-positive' : 'text-ink')}>{value}</span>
    </div>
  );
}

/** Caption weight, not body: an empty state is an aside, and setting it at body size makes
 *  "nothing to show" the loudest thing on the screen. */
function Note({ children }: { children: ReactNode }) {
  return <p className="text-caption text-ink-muted">{children}</p>;
}
