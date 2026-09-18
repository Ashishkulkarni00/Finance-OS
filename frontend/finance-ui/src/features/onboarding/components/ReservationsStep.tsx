import { useState } from 'react';
import { Row } from '@/components/Row';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { RealBalancePreview } from './RealBalancePreview';
import { Amount } from '@/components/Amount';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetReservationsQuery, useCreateReservationMutation } from '@/services/reservationService';

interface ReservationsStepProps {
  onDone: () => void;
}

/** Step 4 (last) - "Anything set aside?" The most skippable step in the sequence.
 *  SCREEN_SPECS S7. */
export function ReservationsStep({ onDone }: ReservationsStepProps) {
  const { data: accountsPage } = useGetAccountsQuery();
  const { data: reservationsPage } = useGetReservationsQuery();
  const [createReservation, { isLoading }] = useCreateReservationMutation();

  const accounts = accountsPage?.content.filter((a) => !a.archived && a.type !== 'CREDIT_CARD') ?? [];
  const reservations = reservationsPage?.content ?? [];

  const [accountId, setAccountId] = useState<number | null>(accounts[0]?.id ?? null);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setError(null);
    const account = accountId ?? accounts[0]?.id;
    if (!account || !amount || !purpose.trim()) {
      setError('An account, an amount, and what it\'s for.');
      return;
    }
    try {
      await createReservation({ accountId: account, amount, purpose: purpose.trim() }).unwrap();
      setAmount('');
      setPurpose('');
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't set that aside.");
    }
  };

  return (
    <div className="flex flex-col gap-space-6">
      <div>
        <h1 className="text-editorial font-serif text-ink">Anything set aside?</h1>
        <p className="mt-space-2 text-body text-ink-muted">
          Money in an account that's already spoken for - an emergency fund, a trip, rent you're holding for
          someone else. Entirely optional.
        </p>
      </div>

      {reservations.length > 0 && (
        <div className="flex flex-col">
          {reservations.map((r) => (
            <Row key={r.id} primary={r.purpose} secondary={r.account.name} trailing={<Amount value={r.amount} role="row" className="text-ink" />} />
          ))}
        </div>
      )}

      <RealBalancePreview />

      {accounts.length > 0 && (
        <div className="flex flex-col gap-space-3 rounded-xl border border-line bg-surface p-space-5">
          <div className="grid grid-cols-3 gap-space-3">
            <Select
              ariaLabel="Account holding this money"
              value={accountId != null ? String(accountId) : ''}
              placeholder="Choose one"
              onChange={(v) => setAccountId(v ? Number(v) : null)}
              options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="Amount"
              className="num h-11 rounded-lg border border-border bg-surface px-space-3 text-label text-ink"
            />
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What's it for?"
              className="h-11 rounded-lg border border-border bg-surface px-space-3 text-label text-ink"
            />
          </div>
          {error && <span className="text-caption text-critical">{error}</span>}
          <div>
            <Button type="button" variant="secondary" onClick={handleAdd} disabled={isLoading}>
              Set aside
            </Button>
          </div>
        </div>
      )}

      <div>
        <Button variant="primary" onClick={onDone}>
          {reservations.length > 0 ? 'Done' : "I'm good - take me in"}
        </Button>
      </div>
    </div>
  );
}
