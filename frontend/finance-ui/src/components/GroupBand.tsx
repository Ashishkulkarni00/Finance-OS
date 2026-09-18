import type { ReactNode } from 'react';

interface GroupBandProps {
  label: ReactNode;
  count?: number;
  figure?: ReactNode;
  caption?: string;
}

/**
 * A band across the full measure, the way the spreadsheet's own header rows do it.
 * Two groups separated only by a whisker of space read as one long list with a stray
 * marker in it; a filled band with its own subtotal makes the break structural.
 *
 * <p>Originally built for Month's Still-to-come/Settled split, reused here for the
 * Ledger's day groups. The subtotal should always come from a server-computed figure,
 * not a client sum of the rows beneath it - the browser never adds money up, and this
 * way the heading cannot disagree with the list under it.
 */
export function GroupBand({ label, count, figure, caption }: GroupBandProps) {
  return (
    <div className="mb-space-2 flex items-baseline justify-between gap-space-4 rounded-md bg-sunken px-space-3 py-space-2">
      <span className="text-micro uppercase tracking-[0.08em] text-ink">
        {label}
        {count != null && <span className="num text-ink-muted"> · {count}</span>}
      </span>
      {figure != null && (
        <span className="text-caption text-ink-muted">
          {figure} {caption}
        </span>
      )}
    </div>
  );
}
