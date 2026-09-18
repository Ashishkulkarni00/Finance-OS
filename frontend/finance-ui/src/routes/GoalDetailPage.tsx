import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Row } from '@/components/Row';
import { Statement, StatementRow } from '@/components/Statement';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/ErrorState';
import { formatShortDate } from '@/lib/dates';
import { useGetGoalQuery } from '@/services/goalService';
import { useGetAccountQuery } from '@/services/accountService';
import { useGetReservationsQuery } from '@/services/reservationService';
import { GoalFunding } from '@/features/plan/components/GoalFunding';

/**
 * Goals had no destination before this - a real, named gap in PLAN_EXPERIENCE.md §4.
 * Shows the rule behind the progress bar: what's actually counted as "current" (an
 * account balance or a reservation), the target, and the required pace.
 */
export default function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const id = Number(goalId);

  const { data: goal, isLoading, isError, refetch } = useGetGoalQuery(id, { skip: !id });
  const { data: linkedAccount } = useGetAccountQuery(goal?.linkedAccountId ?? 0, { skip: !goal?.linkedAccountId });
  const { data: reservationsPage } = useGetReservationsQuery(undefined, { skip: !goal?.linkedReservationId });
  const linkedReservation = reservationsPage?.content.find((r) => r.id === goal?.linkedReservationId);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-space-6 py-space-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !goal) {
    return (
      <div className="mx-auto max-w-2xl py-space-8">
        <ErrorState message="We couldn't load this goal." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-space-8 py-space-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-space-2 self-start text-caption text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        Back
      </button>

      <div className="flex flex-col gap-space-2">
        <h1 className="text-title text-ink">{goal.name}</h1>
        <p className="text-caption text-ink-muted">Target date {formatShortDate(goal.targetDate)}</p>
      </div>

      <div>
        <div className="h-1.5 w-full rounded-full bg-sunken">
          <div className="h-full rounded-full bg-goal" style={{ width: `${Math.min(100, goal.progressPercent)}%` }} />
        </div>
        <p className="num mt-space-2 text-caption text-ink-muted">{goal.progressPercent}% there</p>
      </div>

      <Statement notes>
        <StatementRow label="Current" value={goal.currentAmount} note="Read from what's linked below - never stored separately." />
        <StatementRow variant="total" label="Target" value={goal.targetAmount} note={`By ${formatShortDate(goal.targetDate)}`} />
        {goal.requiredPerMonth ? (
          <StatementRow label="Required per month" value={goal.requiredPerMonth} note="What's left, divided by the months remaining." />
        ) : (
          <StatementRow
            label="Required per month"
            valueNode={<span className="text-row text-ink-muted">—</span>}
            note="The target date has already passed."
          />
        )}
      </Statement>

      <GoalFunding goal={goal} />

      <section>
        <SectionHeader>Where this is tracked</SectionHeader>
        {linkedAccount ? (
          <Row
            primary={linkedAccount.name}
            secondary="This goal's progress is this account's own balance."
            trailing={<span className="text-row text-ink">{linkedAccount.typeLabel}</span>}
            onClick={() => navigate(`/accounts/${linkedAccount.id}`)}
          />
        ) : linkedReservation ? (
          <Row
            primary={linkedReservation.purpose}
            secondary={`Reserved on ${linkedReservation.account.name}`}
            trailing={<span className="text-row text-ink">Reservation</span>}
            onClick={() => navigate(`/accounts/${linkedReservation.account.id}`)}
          />
        ) : (
          <p className="text-caption text-ink-muted">Nothing linked yet - progress reads as ₹0 until an account or a reservation is attached.</p>
        )}
      </section>
    </div>
  );
}
