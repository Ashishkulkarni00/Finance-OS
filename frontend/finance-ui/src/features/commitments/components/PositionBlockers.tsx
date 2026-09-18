import { Link } from 'react-router-dom';
import { InstanceAmountForm } from './InstanceAmountForm';

interface Blocker {
  commitmentInstanceId: string;
  name: string;
}

/**
 * What to do when Real Balance is INCOMPLETE - the answer in place of a link.
 *
 * <p>Shown under the "—" on Today's hero and Month's crux. Both used to offer a single
 * "Fix this" that pointed at an API path (so it went nowhere), and even a working link
 * would only have opened a page whose one action was Settle - recording a payment that
 * hasn't happened. What's actually missing is a number, so this asks for it.
 */
export function PositionBlockers({ blockers }: { blockers: Blocker[] }) {
  if (blockers.length === 0) return null;

  return (
    <div className="flex flex-col gap-space-4 rounded-xl p-space-4" style={{ backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' }}>
      {blockers.map((b) => (
        <div key={b.commitmentInstanceId} className="flex flex-col gap-space-2">
          <div className="flex items-baseline justify-between gap-space-3">
            <span className="text-label text-ink">About how much will {b.name} be?</span>
            <Link
              to={`/commitments/${b.commitmentInstanceId}`}
              className="shrink-0 text-caption text-accent underline-offset-4 hover:underline"
            >
              Open
            </Link>
          </div>
          <InstanceAmountForm instanceId={Number(b.commitmentInstanceId)} name={b.name} />
        </div>
      ))}
      <p className="text-caption text-ink-muted">
        An estimate is enough. When you pay it, what you actually paid is recorded alongside.
      </p>
    </div>
  );
}
