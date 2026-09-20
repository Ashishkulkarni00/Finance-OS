import { useState } from 'react';
import { CircleHelp, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { GoalsSection } from '@/features/plan/components/GoalsSection';
import { GoalsPrimer } from '@/features/plan/components/GoalsPrimer';
import { GoalsGuideSheet } from '@/features/plan/components/GoalsGuideSheet';
import { AddGoalSheet } from '@/features/plan/components/AddGoalSheet';
import { AheadForecast } from '@/features/ahead/components/AheadForecast';

/**
 * Goals - served at /goals (with /plan redirecting here).
 *
 * <p>This screen used to be "Plan": Standing, Goals, Commitment rules and History stacked
 * together. By the user's decision it now holds goals only. The other three components
 * (StandingZone, CommitmentRulesSection, HistorySection) are left in place, unused, so any
 * of them can be given a new home without being rewritten - and recurring bills are still
 * added and worked through on Months.
 *
 * <p>Same frame as every other screen: header, guide, dismissible primer, then the content.
 * "Add a goal" lives in the header and is shared with the empty state, so there is one
 * add sheet rather than one per section.
 */
export default function PlanPage() {
  const [adding, setAdding] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="flex flex-col gap-space-8">
      <AheadForecast />

      <div className="flex flex-col gap-space-6 border-t border-line pt-space-8">
        <div className="flex items-start justify-between gap-space-4">
          <div className="flex flex-col gap-space-1">
            <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Ahead · Goals</span>
            <span className="text-title text-ink">What you’re saving towards</span>
          </div>
          <div className="flex shrink-0 items-center gap-space-4">
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="flex items-center gap-space-1 rounded-md px-space-1 text-caption text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <CircleHelp size={14} strokeWidth={1.5} aria-hidden />
              How Goals works
            </button>
            <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
              <Plus size={14} strokeWidth={1.5} />
              Add a goal
            </Button>
          </div>
        </div>

        <GoalsPrimer onOpenGuide={() => setGuideOpen(true)} />
      </div>

      <div>
        <GoalsSection onAdd={() => setAdding(true)} />
      </div>

      <AddGoalSheet open={adding} onClose={() => setAdding(false)} />
      <GoalsGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
