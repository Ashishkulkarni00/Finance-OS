import { useState } from 'react';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { FORM_ROW_CONTROL } from '@/components/FormRow';
import { formatMoney } from '@/lib/money';
import {
  useCreateReservationMutation,
  useDeleteReservationMutation,
  useGetReservationsQuery,
  useUpdateReservationMutation,
} from '@/services/reservationService';
import { Select } from '@/components/Select';
import { useGetGoalsQuery } from '@/services/goalService';
import type { ReservationResponse } from '@/types/reservation';

const VALID_AMOUNT = /^\d+(\.\d{1,2})?$/;

function message(error: unknown, fallback: string): string {
  return (error as { message?: string } | undefined)?.message ?? fallback;
}

/** Amount + what it's for, used both to add one and to change one. */
function ReservationForm({
  amount: initialAmount,
  purpose: initialPurpose,
  goalId: initialGoalId,
  saving,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  amount?: string;
  purpose?: string;
  goalId?: number | null;
  saving: boolean;
  submitLabel: string;
  onSubmit: (values: { amount: string; purpose: string; goalId: number | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(initialAmount ?? '');
  const [purpose, setPurpose] = useState(initialPurpose ?? '');
  const [goalId, setGoalId] = useState(initialGoalId != null ? String(initialGoalId) : '');
  const [error, setError] = useState<string | null>(null);
  const { data: goalsPage } = useGetGoalsQuery();
  const goals = (goalsPage?.content ?? []).filter((g) => !g.archived);

  const submit = async () => {
    const trimmed = amount.trim();
    if (!VALID_AMOUNT.test(trimmed) || Number(trimmed) <= 0) {
      setError('Enter an amount, like 5000');
      return;
    }
    if (!purpose.trim()) {
      setError('Say what it’s for - that’s what makes it more than a number');
      return;
    }
    setError(null);
    try {
      await onSubmit({ amount: trimmed, purpose: purpose.trim(), goalId: goalId ? Number(goalId) : null });
    } catch (err) {
      setError(message(err, "Couldn't save that."));
    }
  };

  return (
    <div className="flex flex-col gap-space-2 border-b border-line py-space-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-space-3">
        <label className="flex h-9 items-center gap-space-1 rounded-lg border border-border bg-surface px-space-3 focus-within:border-accent">
          <span aria-hidden className="num text-label text-ink-muted">
            ₹
          </span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void submit();
              }
            }}
            aria-label="Amount to set aside"
            placeholder="0"
            className="num w-24 bg-transparent text-label text-ink outline-none placeholder:text-ink-muted"
          />
        </label>
        <input
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void submit();
            }
          }}
          aria-label="What this is for"
          placeholder="What it’s for - rent held for a flatmate, emergency fund…"
          className={FORM_ROW_CONTROL + ' h-9 flex-1 rounded-lg border border-border bg-surface px-space-3'}
        />
        <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => void submit()}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Money set aside for a goal counts towards it without moving anywhere. The column
          has been here since V3 and there was never a way to set it. */}
      {goals.length > 0 && (
        <label className="flex flex-wrap items-center gap-space-2 text-caption text-ink-muted">
          Counts towards
          <Select
            variant="row"
            ariaLabel="The goal this money is set aside for"
            value={goalId}
            placeholder="Nothing in particular"
            clearable
            options={goals.map((g) => ({ value: String(g.id), label: g.name }))}
            onChange={(v) => setGoalId(v ?? '')}
          />
          {goalId && <span>— it stays in this account, and the goal counts it as saved.</span>}
        </label>
      )}
      {error && <span className="text-caption text-critical">{error}</span>}
    </div>
  );
}

function ReservationRow({ reservation }: { reservation: ReservationResponse }) {
  const [editing, setEditing] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateReservation, { isLoading: saving }] = useUpdateReservationMutation();
  const [deleteReservation, { isLoading: deleting }] = useDeleteReservationMutation();

  if (editing) {
    return (
      <ReservationForm
        amount={reservation.amount}
        purpose={reservation.purpose}
        goalId={reservation.goalId}
        saving={saving}
        submitLabel="Save"
        onCancel={() => setEditing(false)}
        onSubmit={async (values) => {
          await updateReservation({ id: reservation.id, body: values }).unwrap();
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-space-2 border-b border-line py-space-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-space-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-row text-ink">{reservation.purpose}</span>
          {reservation.goalId != null && <span className="text-caption text-ink-muted">Counts as progress on a goal</span>}
        </div>
        <span className="flex items-center gap-space-3">
          <Amount value={reservation.amount} role="row" className="text-ink" />
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Change
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setReleasing(true)}>
            Release
          </Button>
        </span>
      </div>
      {releasing && (
        <div className="flex flex-col gap-space-2 rounded-lg border border-line p-space-3">
          <p className="text-caption text-ink-soft">
            Release {formatMoney(reservation.amount)}? The money stays in the account - it just stops being set aside, so
            it counts as spendable again.
            {reservation.goalId != null && ' A goal tracked against it drops back to nothing saved.'}
          </p>
          <span className="flex gap-space-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={deleting}
              onClick={async () => {
                setError(null);
                try {
                  await deleteReservation(reservation.id).unwrap();
                } catch (err) {
                  setError(message(err, "Couldn't release that."));
                  setReleasing(false);
                }
              }}
            >
              Release it
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setReleasing(false)}>
              Keep it set aside
            </Button>
          </span>
        </div>
      )}
      {error && <span className="text-caption text-critical">{error}</span>}
    </div>
  );
}

/**
 * "Set aside" - money sitting in this account that is already spoken for, so it stops
 * counting as spendable (it's the `reserved` in held − reserved − committed).
 *
 * <p>Reservations could only be created during onboarding: after that there was no way to
 * add, change or release one, though the API has always allowed all three. This is that
 * surface, on the account the money actually sits in.
 */
export function SetAsideSection({ accountId }: { accountId: number }) {
  const { data: reservationsPage } = useGetReservationsQuery();
  const [createReservation, { isLoading: creating }] = useCreateReservationMutation();
  const [adding, setAdding] = useState(false);

  const reservations = (reservationsPage?.content ?? []).filter((r) => r.account.id === accountId);

  return (
    <section>
      <SectionHeader
        trailing={
          !adding && (
            <button type="button" onClick={() => setAdding(true)} className="text-accent underline-offset-4 hover:underline">
              + Set money aside
            </button>
          )
        }
      >
        Set aside
      </SectionHeader>

      {reservations.length === 0 && !adding ? (
        <p className="text-caption text-ink-muted">
          Nothing set aside here. Money in this account that’s already spoken for - an emergency fund, rent you’re holding
          for someone else - can be named here, and it stops counting as money you can spend.
        </p>
      ) : (
        <div className="flex flex-col">
          {reservations.map((r) => (
            <ReservationRow key={r.id} reservation={r} />
          ))}
        </div>
      )}

      {adding && (
        <ReservationForm
          saving={creating}
          submitLabel="Set aside"
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            await createReservation({ accountId, ...values }).unwrap();
            setAdding(false);
          }}
        />
      )}
    </section>
  );
}
