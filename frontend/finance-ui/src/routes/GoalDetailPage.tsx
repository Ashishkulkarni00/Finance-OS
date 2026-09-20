import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Row } from '@/components/Row';
import { Button } from '@/components/Button';
import { StatusPill } from '@/components/StatusPill';
import { Statement, StatementRow } from '@/components/Statement';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/ErrorState';
import { formatDayMonthYear } from '@/lib/dates';
import {
  useArchiveGoalMutation,
  useDeleteGoalMutation,
  useGetGoalQuery,
  useUnarchiveGoalMutation,
} from '@/services/goalService';
import { useGetAccountQuery } from '@/services/accountService';
import { useGetReservationsQuery } from '@/services/reservationService';
import { GoalFunding } from '@/features/plan/components/GoalFunding';
import { GoalPayments } from '@/features/plan/components/GoalPayments';
import { AddGoalSheet } from '@/features/plan/components/AddGoalSheet';

/**
 * One goal: how far along it is, what it has to pay and when, what pays into it, and where
 * it's kept - plus edit, archive and delete.
 *
 * <p>"How far along" is saved + already paid out through its payments, so a trip whose
 * bookings were paid in October doesn't look like it went backwards.
 */
export default function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const id = Number(goalId);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: goal, isLoading, isError, refetch } = useGetGoalQuery(id, { skip: !id });
  const { data: linkedAccount } = useGetAccountQuery(goal?.linkedAccountId ?? 0, { skip: !goal?.linkedAccountId });
  const { data: reservationsPage } = useGetReservationsQuery(undefined, { skip: !goal?.linkedReservationId });
  const linkedReservation = reservationsPage?.content.find((r) => r.id === goal?.linkedReservationId);
  const [archiveGoal, { isLoading: archiving }] = useArchiveGoalMutation();
  const [unarchiveGoal, { isLoading: unarchiving }] = useUnarchiveGoalMutation();
  const [deleteGoal, { isLoading: deleting }] = useDeleteGoalMutation();

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

  const hasPayments = goal.schedule.length > 0;
  const spent = Number(goal.spentAmount) > 0;

  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    setActionError(null);
    try {
      await action();
      after?.();
    } catch (err) {
      setActionError((err as { message?: string }).message ?? "That didn't work. Try again.");
    }
  };

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

      <div className="flex flex-col gap-space-3">
        <div className="flex flex-wrap items-center justify-between gap-space-3">
          <div className="flex items-center gap-space-3">
            <h1 className="text-title text-ink">{goal.name}</h1>
            {goal.archived && <StatusPill tone="neutral">Archived</StatusPill>}
          </div>
          <span className="flex items-center gap-space-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil size={14} strokeWidth={1.5} />
              Edit
            </Button>
            {goal.archived ? (
              <Button variant="ghost" size="sm" disabled={unarchiving} onClick={() => run(() => unarchiveGoal(goal.id).unwrap())}>
                Unarchive
              </Button>
            ) : (
              <Button variant="ghost" size="sm" disabled={archiving} onClick={() => run(() => archiveGoal(goal.id).unwrap())}>
                Archive
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)} className="text-critical">
              Delete
            </Button>
          </span>
        </div>
        <p className="text-caption text-ink-muted">Needed by {formatDayMonthYear(goal.targetDate)}</p>
        {goal.archived && (
          <p className="text-caption text-ink-muted">
            Archived: its planned payments and monthly transfers have stopped. Unarchive to pick it up again - bills
            that stopped stay stopped until you add them back.
          </p>
        )}
      </div>

      {confirmingDelete && (
        <div className="flex flex-col gap-space-3 rounded-lg border border-line p-space-4">
          <p className="text-body text-ink">Delete {goal.name}?</p>
          <p className="text-caption text-ink-muted">
            The goal goes, and its planned payments and monthly transfers stop from today. Anything already paid or moved
            stays in your Ledger and past months. Just finished with it? Archive keeps it for reference instead.
          </p>
          <div className="flex gap-space-3">
            <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)} className="flex-1">
              Keep it
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={deleting}
              onClick={() => run(() => deleteGoal(goal.id).unwrap(), () => navigate('/ahead', { replace: true }))}
              className="flex-1 !bg-critical"
            >
              Delete goal
            </Button>
          </div>
        </div>
      )}
      {actionError && <p className="text-caption text-critical">{actionError}</p>}

      <div>
        <div className="h-1.5 w-full rounded-full bg-sunken">
          <div className="h-full rounded-full bg-goal" style={{ width: `${Math.min(100, goal.progressPercent)}%` }} />
        </div>
        <p className="num mt-space-2 text-caption text-ink-muted">
          {goal.progressPercent}% there{spent ? ' - counting what’s already been paid' : ''}
        </p>
      </div>

      <Statement notes>
        <StatementRow
          label="Saved"
          value={goal.currentAmount}
          note={goal.linkedAccountId || goal.linkedReservationId ? 'What’s in the account it’s kept in, now.' : 'Not kept in its own account, so nothing is counted as saved.'}
        />
        {spent && <StatementRow label="Already paid" value={goal.spentAmount} note="Paid out through its payments below." />}
        <StatementRow variant="total" label="Target" value={goal.targetAmount} note={`By ${formatDayMonthYear(goal.targetDate)}`} />
        {goal.requiredPerMonth ? (
          <StatementRow
            label="Set aside a month"
            value={goal.requiredPerMonth}
            note={
              hasPayments
                ? 'Enough to cover every payment below by its own date - the earliest one sets the pace.'
                : 'What’s left, spread over the months until the target date.'
            }
          />
        ) : (
          <StatementRow
            label="Set aside a month"
            valueNode={<span className="text-row text-ink-muted">—</span>}
            note="The target date has already passed."
          />
        )}
      </Statement>

      <GoalPayments goal={goal} />

      <GoalFunding goal={goal} />

      <section>
        <SectionHeader>Saved in</SectionHeader>
        {linkedAccount ? (
          <Row
            primary={linkedAccount.name}
            secondary="What’s in this account is what counts as saved for this goal."
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
          <p className="text-caption text-ink-muted">
            Not kept in its own account. That’s fine for a goal paid straight from your salary account - its payments still
            show on Months. To see it fill up, choose the account you’re saving it in under Edit.
          </p>
        )}
      </section>

      {editing && <AddGoalSheet key={goal.updatedAt} open goal={goal} onClose={() => setEditing(false)} />}
    </div>
  );
}
