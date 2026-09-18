import { useState } from 'react';
import { Row } from '@/components/Row';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { RealBalancePreview } from './RealBalancePreview';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/cn';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCommitmentRulesQuery, useCreateCommitmentRuleMutation } from '@/services/commitmentRuleService';
import { useGetCurrentCycleQuery } from '@/services/cycleService';
import type { CommitmentAmountType } from '@/types/commitmentRule';

interface CommitmentsStepProps {
  onContinue: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Step 3 - "the heavy step." Real Balance visibly sharpens with each one added, since
 *  RealBalancePreview reads live off /position and this mutation invalidates it.
 *  SCREEN_SPECS S7. */
export function CommitmentsStep({ onContinue }: CommitmentsStepProps) {
  const { data: accountsPage } = useGetAccountsQuery();
  const { data: rulesPage } = useGetCommitmentRulesQuery();
  const { data: cycle } = useGetCurrentCycleQuery();
  const [createRule, { isLoading }] = useCreateCommitmentRuleMutation();

  const accounts = accountsPage?.content.filter((a) => !a.archived) ?? [];
  // Bills only - salary was set in the step before.
  const rules = (rulesPage?.content ?? []).filter((r) => r.settleAs !== 'INCOME');

  const [name, setName] = useState('');
  const [amountType, setAmountType] = useState<CommitmentAmountType>('FIXED');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [accountId, setAccountId] = useState<number | null>(accounts[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setError(null);
    const account = accountId ?? accounts[0]?.id;
    if (!name.trim() || !account || (amountType === 'FIXED' && !amount)) {
      setError('A name, an account, and (if fixed) an amount.');
      return;
    }
    try {
      await createRule({
        name: name.trim(),
        amountType,
        fixedAmount: amountType === 'FIXED' ? amount : null,
        frequency: 'MONTHLY',
        dueDay: Math.min(28, Math.max(1, Number(dueDay) || 1)),
        accountId: account,
        mandatory: true,
        requiresVerification: amountType === 'VARIABLE',
        // Onboarding captures commitments that are already running, so this cycle's
        // bill counts - even one whose due date passed before setup. Sending today made
        // those silently skip the current month (see AddCommitmentSheet).
        activeFrom: cycle?.startDate ?? today(),
      }).unwrap();
      setName('');
      setAmount('');
      setDueDay('1');
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't add that commitment.");
    }
  };

  return (
    <div className="flex flex-col gap-space-6">
      <div>
        <h1 className="text-editorial font-serif text-ink">What leaves every month?</h1>
        <p className="mt-space-2 text-body text-ink-muted">
          Rent, EMIs, SIPs, family support - anything that leaves on a schedule, whether or not you know the exact
          amount yet.
        </p>
      </div>

      {rules.length > 0 && (
        <div className="flex flex-col">
          {rules.map((r) => (
            <Row
              key={r.id}
              domainRule="commit"
              primary={r.name}
              secondary={`Due the ${r.dueDay} · ${r.account.name}`}
              trailing={<span className="num text-row text-ink">{r.amountType === 'FIXED' ? formatMoney(r.fixedAmount) : 'Varies'}</span>}
            />
          ))}
        </div>
      )}

      <RealBalancePreview />

      {accounts.length === 0 ? (
        <p className="text-caption text-ink-muted">Add an account first to attach commitments to it.</p>
      ) : (
        <div className="flex flex-col gap-space-3 rounded-xl border border-line bg-surface p-space-5">
          <div className="flex gap-space-2">
            {(['FIXED', 'VARIABLE'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAmountType(t)}
                className={cn(
                  'rounded-full border px-space-4 py-space-2 text-label transition-colors duration-150',
                  amountType === t ? 'border-accent bg-accent-wash text-accent' : 'border-border text-ink-soft hover:bg-sunken',
                )}
              >
                {t === 'FIXED' ? 'Fixed amount' : 'Varies each time'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-space-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="col-span-3 h-11 rounded-lg border border-border bg-surface px-space-3 text-label text-ink sm:col-span-1"
            />
            {amountType === 'FIXED' && (
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="Amount"
                className="num h-11 rounded-lg border border-border bg-surface px-space-3 text-label text-ink"
              />
            )}
            <input
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              inputMode="numeric"
              placeholder="Due day"
              className="num h-11 rounded-lg border border-border bg-surface px-space-3 text-label text-ink"
            />
            <Select
              ariaLabel="Account this leaves from"
              value={accountId != null ? String(accountId) : ''}
              placeholder="Choose one"
              onChange={(v) => setAccountId(v ? Number(v) : null)}
              options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
            />
          </div>
          {error && <span className="text-caption text-critical">{error}</span>}
          <div>
            <Button type="button" variant="secondary" onClick={handleAdd} disabled={isLoading}>
              Add commitment
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-space-4">
        <Button variant="primary" onClick={onContinue}>
          Continue
        </Button>
        {rules.length === 0 && (
          <button type="button" onClick={onContinue} className="text-label text-ink-muted hover:text-ink-soft">
            I'll add this later
          </button>
        )}
      </div>
    </div>
  );
}
