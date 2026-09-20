import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from '@/components/Button';
import { useSetCommitmentInstanceAmountMutation } from '@/services/commitmentInstanceService';

const VALID_AMOUNT = /^\d+(\.\d{1,2})?$/;

/** The API's own message where there is one - it's written for people, not for logs. */
function messageFrom(error: unknown): string {
  const data = (error as { data?: { message?: string; detail?: string } } | undefined)?.data;
  return data?.message ?? data?.detail ?? "Couldn't save that. Try again.";
}

/**
 * "₹ [estimate] [Set amount]" - gives an unpaid bill an expected amount, in place.
 *
 * <p>Inline rather than a sheet because the question is one number and the reason for
 * asking is already on screen next to it ("Room needs a number", "Needs an amount").
 * Settling is a different act - it records a payment - and was the only way to give a
 * variable bill an amount before `PATCH /commitment-instances/{id}` existed, which is
 * why every electricity bill used to blank out Room for most of the cycle.
 *
 * <p><strong>Deliberately not a {@code <form>}.</strong> This is used both standalone
 * (Months' "Estimate" row) and nested inside `EditCommitmentSheet`'s own outer form
 * ("This occurrence's amount") - an HTML `<form>` inside another `<form>` is invalid, and
 * in practice caused a real bug: the browser's own submit handling took over from React's,
 * producing a full page reload and leaving the outer form's own Save button unresponsive
 * (found 2026-09-19). A plain container with an explicit button `onClick` and an Enter
 * handler on the input behaves identically for the user with no such risk, in either
 * context. Validation is format only; the server re-checks everything and owns the value.
 */
export function InstanceAmountForm({ instanceId, name }: { instanceId: number; name: string }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [setAmount, { isLoading }] = useSetCommitmentInstanceAmountMutation();

  const submit = async () => {
    const trimmed = value.trim();
    if (!VALID_AMOUNT.test(trimmed) || Number(trimmed) <= 0) {
      setError('Enter an amount, like 1200');
      return;
    }
    setError(null);
    try {
      await setAmount({ id: instanceId, expectedAmount: trimmed }).unwrap();
      setValue('');
    } catch (err) {
      setError(messageFrom(err));
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    // Stopped here, not left to bubble: an ancestor form (Edit bill) must never treat this
    // as "submit the whole bill" - Enter in this field only ever sets this one amount.
    e.preventDefault();
    e.stopPropagation();
    void submit();
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-space-1">
      <div className="flex items-center gap-space-2">
        <label className="flex h-9 items-center gap-space-1 rounded-lg border border-border bg-surface px-space-3 transition-colors focus-within:border-accent">
          <span aria-hidden className="num text-label text-ink-muted">
            ₹
          </span>
          <input
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Estimate"
            aria-label={`Expected amount for ${name}`}
            className="num w-24 bg-transparent text-label text-ink outline-none placeholder:text-ink-muted"
          />
        </label>
        <Button type="button" size="sm" variant="secondary" disabled={isLoading || !value.trim()} onClick={() => void submit()}>
          {isLoading ? 'Saving…' : 'Set amount'}
        </Button>
      </div>
      {error && <span className="text-caption text-critical">{error}</span>}
    </div>
  );
}
