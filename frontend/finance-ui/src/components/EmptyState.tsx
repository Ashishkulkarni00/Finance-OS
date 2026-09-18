import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  /** The one serif line per screen budget - spend it here if this is the empty state. */
  headline: string;
  body: string;
  action?: ReactNode;
}

/**
 * Icon, one editorial line, one sentence of why it matters, one action. DESIGN_SYSTEM §7.
 *
 * Left-aligned and bounded rather than centred in a void: an empty section is not the
 * most important thing on a page that has real figures on it, and centring it made it
 * read as the hero.
 */
export function EmptyState({ icon: Icon, headline, body, action }: EmptyStateProps) {
  return (
    <div className="flex max-w-[52ch] items-start gap-space-4 py-space-5">
      <Icon size={20} strokeWidth={1.5} className="mt-space-2 shrink-0 text-ink-muted" />
      <div className="flex flex-col gap-space-2">
        <p className="font-serif text-title text-ink">{headline}</p>
        <p className="text-body text-ink-soft">{body}</p>
        {action}
      </div>
    </div>
  );
}
