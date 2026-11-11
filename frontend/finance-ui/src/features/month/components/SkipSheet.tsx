import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { cn } from '@/lib/cn';
import { formatShortDate } from '@/lib/dates';
import type { Money } from '@/lib/money';
import { useSkipCommitmentInstanceMutation } from '@/services/commitmentInstanceService';
import type { SkipReason } from '@/types/commitment';
import { SKIP_REASONS, SKIP_REASON_LABEL } from '../skipReasons';

/** What the sheet needs - both the Month row and the commitment page can supply it. */
export interface SkipTarget {
  id: number;
  commitmentName: string;
  dueDate: string;
  outstanding: Money | null;
  mandatory: boolean;
  /** The commitment's own "if skipped" consequence, when the user wrote one. */
  ifSkipped: string | null;
}

/**
 * "Skip this month" with a reason (2026-11-11: "this month I am not doing the Zerodha SIP").
 *
 * <p>Skipping is a decision about money, so the sheet says what it does before it does it: the
 * amount that comes back into *Free until salary* (the server's own `outstanding` - nothing is
 * summed here), that only this month is affected, and that Undo is in Done.
 *
 * <p><strong>The reason is asked every time</strong>, not only for must-pay: one tap on a chip,
 * and the month's record then says *why* the SIP didn't go in - which is what turns a skip into a
 * decision you can look back on rather than a commitment that quietly vanished. The server
 * requires it for must-pay. A must-pay skip also shows the commitment's own "if skipped" line,
 * when there is one, as a fact - amber, never a verdict (rule 8).
 *
 * <p>Loan EMIs never reach this sheet: the lender debits them regardless (`canSkip`).
 */
export function SkipSheet({ instance, onClose }: { instance: SkipTarget | null; onClose: () => void }) {
  const [skip, { isLoading }] = useSkipCommitmentInstanceMutation();
  const [reason, setReason] = useState<SkipReason | null>(null);
  const [note, setNote] = useState('');

  // A fresh choice for each commitment opened.
  useEffect(() => {
    setReason(null);
    setNote('');
  }, [instance?.id]);

  const known = instance?.outstanding != null;
  const needsNote = reason === 'OTHER' && note.trim() === '';

  const confirm = async () => {
    if (!instance || !reason || needsNote) return;
    try {
      await skip({ id: instance.id, reason, note: note.trim() || undefined }).unwrap();
      onClose();
    } catch {
      // The row stays; the mutation's error is surfaced by the global handler.
    }
  };

  return (
    <Sheet
      open={instance != null}
      onClose={onClose}
      title="Skip this month"
      size="narrow"
      guardDirty={false}
      footer={
        <div className="flex justify-end gap-space-2">
          <Button variant="ghost" onClick={onClose}>
            Keep it
          </Button>
          <Button variant="primary" disabled={isLoading || !reason || needsNote} onClick={confirm}>
            Skip this month
          </Button>
        </div>
      }
    >
      {instance && (
        <div className="flex flex-col gap-space-5">
          <div className="flex flex-col gap-space-1">
            {/* Initial focus lands here (`data-autofocus`, useModalDialog), not on the note: the hook focuses the first
                field, which on a phone raised the keyboard over the reasons before one was picked. */}
            <p tabIndex={-1} data-autofocus className="text-title text-ink outline-none">
              {instance.commitmentName}
            </p>
            <p className="num text-caption text-ink-muted">
              Due {formatShortDate(instance.dueDate)}
              {instance.mandatory && ' · must-pay'}
            </p>
          </div>

          <div className="flex items-baseline justify-between gap-space-4 rounded-xl bg-sunken px-space-4 py-space-3">
            <span className="text-label text-ink-soft">Comes back into Free until salary</span>
            {known ? (
              <Amount value={instance.outstanding} role="section" className="shrink-0 text-positive" signed />
            ) : (
              <span className="shrink-0 text-caption text-ink-muted">No amount set yet</span>
            )}
          </div>

          <fieldset className="flex flex-col gap-space-2">
            <legend className="mb-space-2 text-label font-medium text-ink">Why are you skipping it?</legend>
            <div className="flex flex-wrap gap-space-2" role="radiogroup" aria-label="Why are you skipping it?">
              {SKIP_REASONS.map((r) => {
                const active = r === reason;
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setReason(r)}
                    className={cn(
                      'pressable rounded-full border px-space-3 py-space-2 text-label transition-colors duration-150 pointer-coarse:min-h-11',
                      active
                        ? 'border-accent bg-accent-wash text-ink'
                        : 'border-border text-ink-soft hover:border-ink-muted hover:text-ink',
                    )}
                  >
                    {SKIP_REASON_LABEL[r]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex flex-col gap-space-1">
            <span className="text-caption text-ink-muted">
              {reason === 'OTHER' ? 'What happened?' : 'A note for later (optional)'}
            </span>
            <input
              type="text"
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
              placeholder={reason === 'MONEY_NEEDED_ELSEWHERE' ? 'e.g. bike repair' : ''}
              className="h-10 rounded-lg border border-border bg-surface px-space-3 text-label text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent pointer-coarse:h-11"
            />
          </label>

          {instance.mandatory && instance.ifSkipped && (
            <p className="flex items-start gap-space-2 text-caption text-attention">
              <AlertTriangle size={14} strokeWidth={1.5} aria-hidden className="mt-[2px] shrink-0" />
              <span>If skipped: {instance.ifSkipped}</span>
            </p>
          )}

          <ul className="flex flex-col gap-space-1 text-caption text-ink-muted">
            <li>Only this month. It carries on next month as planned.</li>
            <li>Nothing is deleted. It moves to Done with your reason, and Undo puts it back.</li>
          </ul>
        </div>
      )}
    </Sheet>
  );
}
