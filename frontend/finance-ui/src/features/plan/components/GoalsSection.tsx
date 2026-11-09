import { Target, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { LedgerRow, DomainRule, MetaFacts } from '@/components/LedgerRow';
import { formatMoney } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import { useGetGoalsQuery, useGetGoalFeasibilityQuery } from '@/services/goalService';
import { cn } from '@/lib/cn';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import { SuggestedOrder } from './SuggestedOrder';
import type { GoalFeasibility, GoalResponse } from '@/types/goal';

const MONTH_YEAR = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' });

/**
 * One goal as a ruled row, not a card - the same row every other register uses, so the
 * screen reads like the rest of the product (SCREEN_PURPOSE_AUDIT RC-3: a card per goal
 * cost ~110px each where the source workbook used one line).
 *
 * <p>The progress bar sits in the secondary line so the fact the row exists for - how far
 * along - is visible without opening it. `progressPercent` is the server's; the bar only
 * draws it.
 */
/**
 * The verdict under a goal: can the months before its date carry it? Quiet when the answer is
 * yes, coloured only when it is certainly no - a warning on every "maybe" would teach the
 * reader to skip the one that matters.
 */
function FeasibilityLine({ f }: { f: GoalFeasibility }) {
  const label: Record<GoalFeasibility['state'], string> = {
    COVERED_BY_PLAN: 'On plan',
    FITS: 'Fits',
    FITS_IF: 'Fits if',
    DOES_NOT_FIT: 'Doesn’t fit',
    UNKNOWN: 'Can’t tell',
  };
  return (
    // Its own panel, set in from the row and spaced off it - it was a caption pressed against
    // the goal's line and read as part of it (user, 2026-11-09).
    <div className="mx-space-4 mb-space-4 mt-space-1 flex flex-col gap-space-1 rounded-md bg-sunken px-space-3 py-space-2">
      <span
        className={cn(
          'text-micro uppercase tracking-[0.08em]',
          f.state === 'DOES_NOT_FIT' ? 'text-attention' : f.state === 'FITS' || f.state === 'COVERED_BY_PLAN' ? 'text-positive' : 'text-ink-muted',
        )}
      >
        {label[f.state]}
      </span>
      <p className="text-caption text-ink-soft">{f.reason}</p>
    </div>
  );
}

function GoalRow({ goal, feasibility }: { goal: GoalResponse; feasibility?: GoalFeasibility }) {
  // The next payment it has to make - a trip's bookings - is the date that matters most.
  const next = (goal.schedule ?? []).find((l) => l.commitmentId != null && l.status !== 'PAID');
  const cardDoc = useDocAnchor('goal.card');
  const paceDoc = useDocAnchor('goal.pace');
  return (
    // `LedgerRow` doesn't pass through arbitrary props - wrapping it is the same pattern
    // `LoanRow` uses for `loan.card`.
    <div {...cardDoc}>
    <LedgerRow
      to={`/goals/${goal.id}`}
      leading={<DomainRule domain="goal" />}
      primary={goal.name}
      secondary={
        <span className="flex items-center gap-space-3" {...paceDoc}>
          <span className="h-[6px] w-32 shrink-0 overflow-hidden rounded-full bg-sunken" aria-hidden>
            <span className="block h-full rounded-full bg-goal" style={{ width: `${Math.min(100, goal.progressPercent)}%` }} />
          </span>
          <span className="num">{goal.progressPercent}% of {formatMoney(goal.targetAmount)}</span>
        </span>
      }
      meta={
        <MetaFacts
          items={[
            ...(next
              ? [
                  {
                    label: 'Next',
                    value: `${formatShortDate(next.date)}${next.stillNeeded ? ` · ${formatMoney(next.stillNeeded)}` : ''}`,
                    className: next.status === 'SHORT' ? 'text-attention' : undefined,
                  },
                ]
              : []),
            { label: 'By', value: MONTH_YEAR.format(new Date(goal.targetDate)) },
            ...(goal.requiredPerMonth
              ? [{ label: 'A month', value: <Amount value={goal.requiredPerMonth} role="caption" className="text-ink" /> }]
              : []),
          ]}
        />
      }
      amount={
        <>
          <Amount value={goal.currentAmount} role="row" className="text-ink" />
          <div className="text-caption text-ink-muted">saved</div>
        </>
      }
    />
    {feasibility && <FeasibilityLine f={feasibility} />}
    </div>
  );
}

/**
 * Goals - the whole screen now. Loading, error and empty are each their own state: this
 * used to fall through to the "add your first goal" empty state when the request failed,
 * telling someone with goals that they had none.
 */
export function GoalsSection({ onAdd }: { onAdd: () => void }) {
  const { data: goalsPage, isLoading, isError, refetch } = useGetGoalsQuery();
  const goals = (goalsPage?.content ?? []).filter((g) => !g.archived);
  // A second request, not a blocker: goals render without it, and a failure just leaves the verdicts off.
  const { data: feasibility } = useGetGoalFeasibilityQuery(undefined, { skip: goals.length === 0 });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="We couldn't load your goals. Check your connection and try again." onRetry={refetch} />;
  }

  if (goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        headline="A goal turns ‘I should save’ into ‘I need ₹8,300 a month’."
        body="Set a target and a date, link it to where the money sits, and Kosh tells you honestly what it takes."
        action={
          <Button variant="secondary" onClick={onAdd}>
            <Plus size={16} strokeWidth={1.5} />
            Add a goal
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-space-8">
    <section>
      <SectionHeader trailing={`${goals.length} in progress`}>Your goals</SectionHeader>
      <div className="flex flex-col">
        {goals.map((goal) => (
          <GoalRow key={goal.id} goal={goal} feasibility={feasibility?.find((f) => f.goalId === goal.id)} />
        ))}
      </div>
      {goals.length > 1 && feasibility && (
        <p className="mt-space-3 text-caption text-ink-muted">
          Judged against the money that will actually be free, after your usual spending — in priority order, each goal
          taking its share before the next. Two goals that each fit alone can fail together.
        </p>
      )}
    </section>
    <SuggestedOrder />
    </div>
  );
}
