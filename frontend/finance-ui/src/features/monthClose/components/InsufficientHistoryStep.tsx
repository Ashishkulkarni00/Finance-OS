import { Card } from '@/components/Card';

/** Replaces "What changed" + "Next cycle" until there's enough history to say something
 *  honest. SCREEN_SPECS S6's own fallback state - no baseline computation exists in the
 *  backend yet, so this stays shown regardless of cycle count rather than faking a
 *  comparison once an arbitrary threshold is crossed. */
export function InsufficientHistoryStep() {
  return (
    <div className="flex flex-col gap-space-6">
      <div>
        <h1 className="text-editorial font-serif text-ink">We're still learning your normal.</h1>
        <p className="mt-space-2 text-body text-ink-muted">
          Spending comparisons and next-cycle suggestions need a real baseline to be honest instead of a guess.
          We'll start showing those once there's history to compare against.
        </p>
      </div>
      <Card>
        <p className="text-caption text-ink-muted">
          Nothing to confirm here - this step is informational and always continues.
        </p>
      </Card>
    </div>
  );
}
