import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { NumberDisplay } from '@/components/NumberDisplay';
import { ErrorState } from '@/components/ErrorState';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/cn';
import type { CycleSnapshotResponse } from '@/types/cycle';

interface CloseStepProps {
  onClose: () => void;
  isClosing: boolean;
  error: string | null;
  snapshot: CycleSnapshotResponse | null;
  onDone: () => void;
}

/**
 * How many of the month's commitments were actually kept - paid, or settled earlier.
 *
 * Sits beside "Saved" because the two answer different questions and both matter. Money
 * saved is an outcome, and it swings on one big electricity bill. Commitments kept is
 * behaviour, and behaviour is the thing that can be different next month. With ~76% of
 * income committed it is the number that decides whether a month went well: spending less
 * while missing an EMI is a bad month wearing a good month's clothes.
 *
 * Renders nothing when the figures are null - a cycle that closed before this was recorded
 * (ADR-0015). "0 of 0 kept" would read as a month in which everything was missed.
 */
function KeptDisplay({ snapshot }: { snapshot: CycleSnapshotResponse }) {
  const { commitmentsKept: kept, commitmentsPlanned: planned } = snapshot;
  if (kept == null || planned == null || planned === 0) return null;

  const all = kept === planned;
  return (
    <div className="flex flex-col items-start gap-space-2 text-left">
      <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Kept</span>
      {/* `num` for tabular figures, matching every other number in the product. */}
      <span className={cn('num text-hero', all ? 'text-positive' : 'text-ink')}>
        {kept}
        <span className="text-ink-muted"> of </span>
        {planned}
      </span>
    </div>
  );
}

/**
 * What the month's commitments were planned to cost against what they did cost - the
 * question "did I keep to my plan?" in rupees, next to the same question in counts.
 *
 * `plannedCommittedTotal` is null when any one commitment's amount was never known, so
 * there is genuinely no planned total to compare against - say so rather than compare
 * against a figure with the unknowns quietly dropped (ADR-0006).
 */
function PlanVsActual({ snapshot }: { snapshot: CycleSnapshotResponse }) {
  const { plannedCommittedTotal: planned, actualCommittedTotal: actual } = snapshot;
  if (actual == null) return null;

  if (planned == null) {
    return (
      <p className="mt-space-4 text-caption text-ink-muted">
        Commitments cost {formatMoney(actual)}. One of them had no set amount, so there is no planned total to compare.
      </p>
    );
  }

  // Comparison only - which of the two is larger, to choose a word. The gap itself is
  // deliberately NOT computed and shown: the frontend never does money arithmetic
  // (FRONTEND_CONVENTIONS §4 rule 2). If that figure is worth having, it comes from the
  // server, where the maths is BigDecimal.
  const a = Number(actual);
  const p = Number(planned);
  const verdict = a === p ? 'exactly to plan' : a > p ? 'more than planned' : 'less than planned';

  return (
    <p className="mt-space-4 text-caption text-ink-muted">
      Commitments: planned {formatMoney(planned)} · actual {formatMoney(actual)} — {verdict}.
    </p>
  );
}

/** Step 6 (final) - the actual write, and the permanent record it leaves behind. SCREEN_SPECS S6. */
export function CloseStep({ onClose, isClosing, error, snapshot, onDone }: CloseStepProps) {
  if (snapshot) {
    return (
      <div className="flex flex-col items-center gap-space-6 py-space-8 text-center">
        <CheckCircle2 size={32} strokeWidth={1.5} className="text-positive" />
        <div>
          <h1 className="text-editorial font-serif text-ink">This cycle is closed.</h1>
          <p className="mt-space-2 text-body text-ink-muted">A permanent record now lives in your history.</p>
        </div>
        <Card className="w-full max-w-sm">
          <div className="flex items-start justify-between gap-space-6">
            <NumberDisplay label="Saved" value={snapshot.net} role="hero" />
            <KeptDisplay snapshot={snapshot} />
          </div>
          <PlanVsActual snapshot={snapshot} />
        </Card>
        <Button variant="primary" onClick={onDone}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-6">
      <div>
        <h1 className="text-editorial font-serif text-ink">Ready to close this cycle?</h1>
        <p className="mt-space-2 text-body text-ink-muted">
          This writes a permanent snapshot of the numbers you just saw. It can't be undone from here.
        </p>
      </div>
      {error && <ErrorState message={error} />}
      <div>
        <Button variant="primary" onClick={onClose} disabled={isClosing}>
          {isClosing ? 'Closing…' : 'Close cycle'}
        </Button>
      </div>
    </div>
  );
}
