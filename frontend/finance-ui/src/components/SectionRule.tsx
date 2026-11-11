import type { ReactNode } from 'react';

/**
 * A group header that isn't a date: a label, a hairline, and an optional trailing figure.
 * The non-date sibling of `DateRule`, used by Today's "Needs you" and "Before payday".
 */
export function SectionRule({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="flex items-center gap-space-3 pb-space-2 pt-space-3">
      <h2 className="text-label font-medium text-ink">{children}</h2>
      <span aria-hidden className="h-px flex-1 bg-line" />
      {trailing != null && <span className="num shrink-0 text-caption text-ink-soft">{trailing}</span>}
    </div>
  );
}
