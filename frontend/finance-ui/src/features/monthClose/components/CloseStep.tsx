import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { NumberDisplay } from '@/components/NumberDisplay';
import { ErrorState } from '@/components/ErrorState';
import type { CycleSnapshotResponse } from '@/types/cycle';

interface CloseStepProps {
  onClose: () => void;
  isClosing: boolean;
  error: string | null;
  snapshot: CycleSnapshotResponse | null;
  onDone: () => void;
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
          <NumberDisplay label="Saved" value={snapshot.net} role="hero" />
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
