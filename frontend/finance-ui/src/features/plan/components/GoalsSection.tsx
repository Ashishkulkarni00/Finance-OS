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
import { useGetGoalsQuery } from '@/services/goalService';
import type { GoalResponse } from '@/types/goal';

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
function GoalRow({ goal }: { goal: GoalResponse }) {
  // The next payment it has to make - a trip's bookings - is the date that matters most.
  const next = (goal.schedule ?? []).find((l) => l.commitmentId != null && l.status !== 'PAID');
  return (
    <LedgerRow
      to={`/goals/${goal.id}`}
      leading={<DomainRule domain="goal" />}
      primary={goal.name}
      secondary={
        <span className="flex items-center gap-space-3">
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
    <section>
      <SectionHeader trailing={`${goals.length} in progress`}>Your goals</SectionHeader>
      <div className="flex flex-col">
        {goals.map((goal) => (
          <GoalRow key={goal.id} goal={goal} />
        ))}
      </div>
    </section>
  );
}
