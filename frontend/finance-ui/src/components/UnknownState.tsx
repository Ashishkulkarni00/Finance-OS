import { Link } from 'react-router-dom';

interface UnknownStateProps {
  reason: string;
  fix?: string | null;
}

/**
 * "We don't know yet" - a designed, first-class state, distinct from an error.
 * Nothing failed. See ADR-0006 and DESIGN_SYSTEM §7 "Unknown".
 */
export function UnknownState({ reason, fix }: UnknownStateProps) {
  return (
    <div className="flex flex-col items-start gap-space-2">
      <span className="num text-hero text-ink-muted">—</span>
      <p className="text-body text-ink-soft">{reason}</p>
      {fix && (
        <Link to={fix} className="text-label text-accent hover:underline underline-offset-4">
          Fix this
        </Link>
      )}
    </div>
  );
}
