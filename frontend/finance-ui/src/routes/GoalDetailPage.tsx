import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Row } from '@/components/Row';
import { Button } from '@/components/Button';
import { StatusPill } from '@/components/StatusPill';
import { Statement, StatementRow } from '@/components/Statement';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { Disclosure } from '@/components/Disclosure';
import { FactStrip, type Fact } from '@/components/FactStrip';
import {
  ArchivedNotice,
  DangerZone,
  DetailError,
  DetailHeader,
  DetailHero,
  DetailLoading,
  DetailPage,
  type DangerItemProps,
} from '@/components/detail/DetailPage';
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
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: goal, isLoading, isError, error, refetch } = useGetGoalQuery(id, { skip: !id });
  const { data: linkedAccount } = useGetAccountQuery(goal?.linkedAccountId ?? 0, { skip: !goal?.linkedAccountId });
  const { data: reservationsPage } = useGetReservationsQuery(undefined, { skip: !goal?.linkedReservationId });
  const linkedReservation = reservationsPage?.content.find((r) => r.id === goal?.linkedReservationId);
  const [archiveGoal, { isLoading: archiving }] = useArchiveGoalMutation();
  const [unarchiveGoal, { isLoading: unarchiving }] = useUnarchiveGoalMutation();
  const [deleteGoal, { isLoading: deleting }] = useDeleteGoalMutation();

  if (isLoading) return <DetailLoading />;
  if (isError || !goal) {
    return <DetailError what="goal" backTo="/ahead" backLabel="Goals" error={error} onRetry={refetch} />;
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

  const facts: Fact[] = [{ label: 'Target', value: <Amount value={goal.targetAmount} role="row" /> }];
  if (goal.requiredPerMonth) {
    facts.push({ label: 'Set aside a month', value: <Amount value={goal.requiredPerMonth} role="row" /> });
    facts.push({
      label: 'Going in a month',
      value: goal.fundingVaries > 0 ? 'Varies' : <Amount value={goal.fundedPerMonth} role="row" />,
    });
  }

  const danger: DangerItemProps[] = [];
  if (!goal.archived) {
    danger.push({
      title: 'Archive this goal',
      body: 'Its planned payments and monthly transfers stop. The goal stays for reference, and you can unarchive it - though commitments that stopped stay stopped until you add them back.',
      actionLabel: 'Archive',
      busy: archiving,
      confirm: {
        title: `Archive ${goal.name}?`,
        body: 'Its planned payments and monthly transfers stop from today. You can unarchive it later, but commitments that stopped stay stopped until you add them back.',
        confirmLabel: 'Archive',
      },
      onAction: () => run(() => archiveGoal(goal.id).unwrap()),
    });
  }
  danger.push({
    title: 'Delete this goal',
    body: 'The goal goes, and its planned payments and monthly transfers stop from today. Anything already paid or moved stays in your Ledger and past months. Just finished with it? Archive keeps it instead.',
    actionLabel: 'Delete',
    busy: deleting,
    destructive: true,
    confirm: {
      title: `Delete ${goal.name}?`,
      body: 'The goal goes, and its planned payments and monthly transfers stop from today. Anything already paid or moved stays in your Ledger and past months.',
      confirmLabel: 'Delete goal',
    },
    onAction: () => run(() => deleteGoal(goal.id).unwrap(), () => navigate('/ahead', { replace: true })),
  });

  return (
    <DetailPage backLabel="Goals" backTo="/ahead">
      <DetailHeader
        title={goal.name}
        chips={goal.archived ? <StatusPill tone="neutral">Archived</StatusPill> : undefined}
        subtitle={`Needed by ${formatDayMonthYear(goal.targetDate)}`}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil size={14} strokeWidth={1.5} />
            Edit
          </Button>
        }
      />

      {goal.archived && (
        <ArchivedNotice
          title="Archived"
          body="Its planned payments and monthly transfers have stopped. Unarchive to pick it up again - commitments that stopped stay stopped until you add them back."
          actionLabel="Unarchive"
          busy={unarchiving}
          onAction={() => void run(() => unarchiveGoal(goal.id).unwrap())}
        />
      )}

      <div className="m-card flex flex-col gap-space-5 max-md:gap-space-4">
        <DetailHero
          label="Saved"
          sentence={`${Math.round(goal.progressPercent)}% of the way there${spent ? ', counting what’s already been paid' : ''}.`}
        >
          <Amount value={goal.currentAmount} role="hero" />
          <div className="mt-space-3 h-1.5 w-full max-w-[18rem] rounded-full bg-sunken" aria-hidden>
            <div className="h-full rounded-full bg-goal" style={{ width: `${Math.min(100, goal.progressPercent)}%` }} />
          </div>
        </DetailHero>
        <FactStrip facts={facts} className="border-y border-line" />
      </div>

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

      <Disclosure storageKey="kosh.goal.figures" label="How these figures are worked out" summary="saved, paid, target, per month">
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

        {/* What is actually going in, beside what is needed. Without this the page states a
            requirement and never says whether anything is meeting it - which is how a goal
            with nothing funding it used to read as fine. */}
        {goal.requiredPerMonth &&
          (goal.fundingVaries > 0 ? (
            <StatementRow
              label="Going in a month"
              valueNode={<span className="text-row text-ink-muted">—</span>}
              note={`${goal.fundingVaries === 1 ? 'A bill funding this goal varies' : `${goal.fundingVaries} bills funding this goal vary`}, so what goes in each month is your call — we can't say whether it's enough.`}
            />
          ) : (
            <StatementRow
              label="Going in a month"
              value={goal.fundedPerMonth}
              note={
                goal.fundedPerMonth != null && Number(goal.fundedPerMonth) === 0
                  ? 'Nothing is funding this goal yet. Add a bill that pays into it.'
                  : 'From the bills that pay into this goal. One-off top-ups aren’t counted here — money once isn’t money a month.'
              }
            />
          ))}
      </Statement>
      </Disclosure>

      <DangerZone items={danger} error={actionError} />

      {editing && <AddGoalSheet key={goal.updatedAt} open goal={goal} onClose={() => setEditing(false)} />}
    </DetailPage>
  );
}
