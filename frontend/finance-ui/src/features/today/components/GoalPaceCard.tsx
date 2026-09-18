import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { Card } from '@/components/Card';
import { ProgressRule } from '@/components/ProgressRule';
import { SectionHeader } from '@/components/SectionHeader';
import { useGetGoalsQuery } from '@/services/goalService';
import type { GoalResponse } from '@/types/goal';

const MONTH_YEAR = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' });

function monthYear(iso: string): string {
  return MONTH_YEAR.format(new Date(`${iso}T00:00:00`));
}

/** Percentages arrive as numbers with up to 2 decimals; whole points read better here. */
function points(value: number | null): string {
  return value == null ? '—' : `${Math.round(value)}%`;
}

function Explanation({ goal }: { goal: GoalResponse }) {
  if (goal.pace === 'OVERDUE') {
    return (
      <p className="text-caption text-ink-soft">
        {points(goal.progressPercent)} of <Amount value={goal.targetAmount} role="caption" /> saved, and its date (
        {monthYear(goal.targetDate)}) has passed. Set a new date or amount so the plan stays honest.
      </p>
    );
  }
  return (
    <p className="text-caption text-ink-soft">
      {points(goal.progressPercent)} saved with {points(goal.timeElapsedPercent)} of the time to{' '}
      {monthYear(goal.targetDate)} gone.{' '}
      {goal.requiredPerMonth != null && (
        <>
          <Amount value={goal.requiredPerMonth} role="caption" className="text-ink" /> a month from now still reaches it on time.
        </>
      )}
    </p>
  );
}

/**
 * Today's reminder that a goal is slipping - the highest-priority goal that's behind its
 * pace or past its date (server-computed `pace`; goals arrive in priority order). Shows
 * nothing when every goal is on track: a reminder that's always there stops being read.
 *
 * <p>States facts, never a verdict: "behind its pace", with what it takes from here.
 */
export function GoalPaceCard() {
  const { data } = useGetGoalsQuery();
  const slipping = (data?.content ?? []).filter((g) => !g.archived && (g.pace === 'BEHIND' || g.pace === 'OVERDUE'));
  const goal = slipping[0];
  if (!goal) return null;

  return (
    <section>
      <SectionHeader trailing={slipping.length > 1 ? `${slipping.length - 1} more behind` : undefined}>Goal to push</SectionHeader>
      <Card domainRule="goal" className="flex flex-col gap-space-3">
        <Link to={`/goals/${goal.id}`} className="group flex items-start gap-space-3">
          <Target size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-space-3">
              <span className="text-row text-ink group-hover:underline group-hover:underline-offset-4">{goal.name}</span>
              <Amount value={goal.currentAmount} role="row" className="text-ink" />
            </div>
            <p className="mt-space-1 text-caption text-attention">
              {goal.pace === 'OVERDUE' ? 'Target date passed' : 'Behind its pace'}
            </p>
          </div>
        </Link>
        {/* A ratio of two percentages, not money. */}
        <ProgressRule fraction={Math.min(1, goal.progressPercent / 100)} />
        <Explanation goal={goal} />
        {slipping.length > 1 && (
          <Link to="/goals" className="text-caption text-accent underline-offset-2 hover:underline">
            See all goals
          </Link>
        )}
      </Card>
    </section>
  );
}
