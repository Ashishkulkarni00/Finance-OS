import { AlertTriangle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type RowMarkTone = 'attention' | 'critical' | 'neutral';

/**
 * The Ledger's leading mark - a 28px tinted square with one icon - for rows that are not
 * transactions: a warning ("Needs you", "Needs a look") or a lever. Same size and shape as
 * `TypeMark`, so every list in the product shares one row grammar.
 */
export function RowMark({ tone, icon: Icon = AlertTriangle }: { tone: RowMarkTone; icon?: LucideIcon }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md',
        tone === 'critical' && 'bg-critical-wash text-critical',
        tone === 'attention' && 'bg-attention-wash text-attention',
        tone === 'neutral' && 'bg-sunken text-ink-muted',
      )}
    >
      <Icon size={15} strokeWidth={1.5} />
    </span>
  );
}
