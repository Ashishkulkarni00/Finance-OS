import type { ReactNode } from 'react';
import { CheckCircle2, CircleSlash, Pencil } from 'lucide-react';
import { LedgerRow, DomainRule } from '@/components/LedgerRow';
import { StatusPill } from '@/components/StatusPill';

/**
 * `paid` and `skipped` are both "no longer needs you", and used to share one `completed`
 * tone - which gave a skipped bill the same green tick as a paid one. They are opposite
 * facts: one is money that moved, the other is money that deliberately did not.
 */
type WorklistRowTone = 'pending' | 'paid' | 'skipped';

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
  /** The secondary slot holds a progress rule rather than one line of text - see
   *  `LedgerRow`, which would otherwise clip it. */
  richSecondary?: boolean;
  /** The word on a settled row's tag - "Paid" for a bill, "Received" for income. */
  doneLabel?: string;
  /** Tier 1 (Needs You) items render as cards elsewhere, not this row - see
   *  the insight list (components/InsightList.tsx) - so this only ever needs to distinguish
   *  what still wants doing from what is done and what was declined. */
  tone?: WorklistRowTone;
}

/**
 * A row on Zone 4's plan list - opens the commitment's detail page. Layout, alignment
 * and click behaviour all live in {@link LedgerRow}, shared with the Accounts registers;
 * this only adds what's specific to a commitment: the settled tick, the edit pencil, and
 * holding the action column open on settled rows so their figures stay in line with the
 * pending ones above.
 */
export function WorklistRow({ instanceId, primary, secondary, meta, amount, action, onEdit, leading, tone = 'pending', richSecondary, doneLabel }: WorklistRowProps) {
  const paid = tone === 'paid';
  const skipped = tone === 'skipped';

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
    // `LedgerRow` doesn't pass through arbitrary props - wrapping it is what lets a
    // right-click anywhere on a plan row resolve to "Settling a bill" (`month.plan-row`),
    // the same pattern `LoanRow` uses for `loan.card`.
    // Two earlier attempts at "make done stand out" were rejected and both were the same
    // mistake: colouring the row's *container* - first a 2px left bar, then a green wash.
    // On a page built from hairlines and aligned columns, anything that paints behind or
    // beside a row reads as a foreign object stuck onto it.
    //
    // A tag is an object *in* the row, in the flow, next to the thing it describes. It also
    // says a word, so it does not depend on a reader knowing what green means.
    <div data-doc="month.plan-row">
      <LedgerRow
        to={`/commitments/${instanceId}`}
        leading={
          paid ? (
            <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
          ) : skipped ? (
            // Not a tick: nothing was paid. A struck-through circle says "deliberately not
            // done", which is what skipping is, without implying anything went wrong.
            <CircleSlash size={18} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />
          ) : (
            (leading ?? <DomainRule domain="commit" />)
          )
        }
        primary={
          paid ? (
            <span className="flex items-center gap-space-2">
              <span className="truncate">{primary}</span>
              <StatusPill tone="positive" solid>
                {doneLabel ?? 'Paid'}
              </StatusPill>
            </span>
          ) : (
            primary
          )
        }
        secondary={secondary}
        meta={meta}
        amount={amount}
        action={actions}
        reserveAction
        // Room for the pencil beside Settle / Estimate. A third control does not fit: adding
        // one briefly (V22's "Amount" button) overflowed left and printed across the figure
        // as "₹10,000Amount", the same collision InvestmentRow hit with Edit + Value. If a
        // row ever needs a third, this has to grow with it.
        actionWidth="7.5rem"
        muted={skipped}
        richSecondary={richSecondary}
      />
    </div>
  );
}
