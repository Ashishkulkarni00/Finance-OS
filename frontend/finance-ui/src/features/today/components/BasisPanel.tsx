import { Link } from 'react-router-dom';
import { Amount } from '@/components/Amount';
import type { Provenance, ProvenanceLine } from '@/types/financialState';

/** Where a referenced thing lives. The server names the *kind*; routes are ours. */
function routeFor(ref: ProvenanceLine['ref']): string | null {
  if (!ref) return null;
  switch (ref.kind) {
    case 'ACCOUNT':
      return `/accounts/${ref.id}`;
    case 'COMMITMENT':
      return `/commitment-rules/${ref.id}`;
    case 'LOAN':
      return `/loans/${ref.id}`;
    case 'GOAL':
      return `/goals/${ref.id}`;
    case 'INVESTMENT':
      return '/money/investments';
    default:
      return null;
  }
}

/**
 * Why a figure is what it is (ROADMAP 2.3).
 *
 * <p>Every figure in this product is derived rather than stored, which is what keeps it
 * honest and also what makes it opaque: "1.7 months" is a claim until you can see the five
 * balances and eleven bills behind it. This is the working, and each line links back to the
 * thing itself — so the answer to "why?" is never "because we said so".
 *
 * <p><strong>Excluded inputs are listed, not hidden.</strong> A bill with no amount is part
 * of the answer, and usually the important part: it is the reason the figure is a ceiling
 * rather than a fact. Showing only what was counted would make an incomplete derivation look
 * complete, which is the failure ADR-0006 exists to prevent.
 */
export function BasisPanel({ basis }: { basis: Provenance }) {
  return (
    <div className="border-b border-line bg-sunken/40 px-space-4 py-space-4">
      <p className="mb-space-4 text-caption text-ink-soft">{basis.formula}</p>

      <div className="flex flex-col gap-space-5 sm:flex-row sm:gap-space-8">
        {basis.sections.map((section, i) => (
          <div key={section.heading ?? i} className="min-w-0 flex-1">
            {section.heading && (
              <p className="mb-space-2 text-micro uppercase tracking-[0.08em] text-ink-muted">{section.heading}</p>
            )}

            <ul className="flex flex-col gap-space-1">
              {section.lines
                .filter((l) => !l.excluded)
                .map((line) => (
                  <li key={`${line.ref?.kind}-${line.ref?.id}-${line.label}`} className="flex items-baseline justify-between gap-space-4">
                    <LineLabel line={line} />
                    <span className="num shrink-0 tabular-nums">
                      <Amount value={line.amount ?? null} role="caption" />
                    </span>
                  </li>
                ))}
            </ul>

            {section.total != null && (
              <p className="mt-space-2 flex items-baseline justify-between gap-space-4 border-t border-border pt-space-2">
                <span className="text-caption font-medium text-ink">Total</span>
                <span className="num shrink-0 tabular-nums">
                  <Amount value={section.total} role="caption" className="text-ink" />
                </span>
              </p>
            )}

            {section.lines.some((l) => l.excluded) && (
              <ul className="mt-space-2 flex flex-col gap-space-1">
                {section.lines
                  .filter((l) => l.excluded)
                  .map((line) => (
                    <li key={`x-${line.ref?.kind}-${line.ref?.id}-${line.label}`} className="flex items-baseline justify-between gap-space-4">
                      <LineLabel line={line} muted />
                      {/* An em dash, not a zero: it has no amount - it does not have an
                          amount of nothing. */}
                      <span className="shrink-0 text-caption text-ink-muted">—</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {basis.caveats.length > 0 && (
        <ul className="mt-space-4 flex flex-col gap-space-1 border-t border-line pt-space-3">
          {basis.caveats.map((caveat) => (
            <li key={caveat} className="text-caption text-ink-muted">
              {caveat}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LineLabel({ line, muted }: { line: ProvenanceLine; muted?: boolean }) {
  const route = routeFor(line.ref);
  const className = `min-w-0 truncate text-caption ${muted ? 'text-ink-muted' : 'text-ink-soft'}`;
  if (!route) {
    return <span className={className}>{line.label}</span>;
  }
  return (
    <Link to={route} className={`${className} underline-offset-2 hover:text-ink hover:underline`}>
      {line.label}
    </Link>
  );
}
