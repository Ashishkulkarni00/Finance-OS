import type { ReactNode } from 'react';
import { CheckCircle2, Pencil } from 'lucide-react';
import { LedgerRow, DomainRule } from '@/components/LedgerRow';

type WorklistRowTone = 'pending' | 'completed';

interface WorklistRowProps {
  instanceId: number;
  primary: ReactNode;
  /** The consequence text ("Family depends on it") when we have one. This is the
   *  row-level justification - DESIGN_SYSTEM's whole point of naming why a commitment
   *  matters, right where you'd act on it. */
  secondary?: ReactNode;
  /** Right-aligned: when it's due, and which account it leaves from. */
  meta?: ReactNode;
  amount: ReactNode;
  action?: ReactNode;
  /** Opens "Edit bill". Shown as a pencil beside the action on every row. */
  onEdit?: () => void;
  /** Pending rows only - replaces the plain domain rule, e.g. with a `DateBlock`. A
   *  settled row always shows its tick: once paid, *that* is the fact worth leading with. */
  leading?: ReactNode;
  /** Tier 1 (Needs You) items render as cards elsewhere, not this row - see
   *  the insight list (components/InsightList.tsx) - so this only ever needs to distinguish pending from settled. */
  tone?: WorklistRowTone;
}

/**
 * A row on Zone 4's plan list - opens the commitment's detail page. Layout, alignment
 * and click behaviour all live in {@link LedgerRow}, shared with the Accounts registers;
 * this only adds what's specific to a commitment: the settled tick, the edit pencil, and
 * holding the action column open on settled rows so their figures stay in line with the
 * pending ones above.
 */
export function WorklistRow({ instanceId, primary, secondary, meta, amount, action, onEdit, leading, tone = 'pending' }: WorklistRowProps) {
  const completed = tone === 'completed';

  const actions =
    onEdit || action ? (
      <span className="flex items-center justify-end gap-space-1">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit"
            title="Edit"
            className="rounded-md p-space-1 text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <Pencil size={15} strokeWidth={1.5} aria-hidden />
          </button>
        )}
        {action}
      </span>
    ) : undefined;

  return (
    <LedgerRow
      to={`/commitments/${instanceId}`}
      leading={
        completed ? (
          <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
        ) : (
          (leading ?? <DomainRule domain="commit" />)
        )
      }
      primary={primary}
      secondary={secondary}
      meta={meta}
      amount={amount}
      action={actions}
      reserveAction
      // Room for the pencil beside Settle / Estimate.
      actionWidth="7.5rem"
      muted={completed}
    />
  );
}
