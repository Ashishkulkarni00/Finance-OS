import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatSalaryDate } from '@/lib/dates';
import type { InsightItem } from '@/types/insight';
import type { FinancialStateResponse } from '@/types/financialState';

/**
 * Today's status line (UI_UX_REVAMP_PLAN 4.1): **one row that is either the all-clear or the way
 * into what needs the user.** It replaces a stack of warning cards under the hero - the cards
 * now live in the Needs-you panel, one tap away, so the answer to "can I spend" is not buried
 * under work.
 *
 * <p><strong>Loud only when it matters.</strong> With something to do, the row is an amber band
 * (red only for a CRITICAL item - never both) naming the most urgent thing and how many more.
 * With nothing, it is plain text with a tick, and the line under it says **why** it is clear: a
 * reason is more satisfying than a compliment, and it is still true on the day it stops being
 * clear (DESIGN_SYSTEM §12 rule 8: never judge, in either direction).
 *
 * <p>`needs` is the TODAY surface's items that are CRITICAL or ATTENTION and not already
 * attached to a payment row - a warning is said once on a screen.
 */
export function TodayStatus({
  needs,
  state,
  whatMoved,
  onOpen,
}: {
  needs: InsightItem[];
  state: FinancialStateResponse;
  /** The server's "what went right" lines, which it withholds whenever anything is urgent. */
  whatMoved: string[] | undefined;
  onOpen: () => void;
}) {
  if (needs.length > 0) {
    const top = needs[0]!;
    const critical = top.severity === 'CRITICAL';
    const rest = needs.length - 1;
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className="pressable flex w-full items-center gap-space-3 rounded-xl px-space-4 py-space-3 text-left transition-colors duration-150"
        style={{
          backgroundColor: `color-mix(in srgb, var(${critical ? '--critical' : '--attention'}) 8%, var(--surface))`,
          boxShadow: `inset 2px 0 0 var(${critical ? '--critical' : '--attention'})`,
        }}
      >
        <AlertTriangle size={16} strokeWidth={1.5} aria-hidden className={critical ? 'shrink-0 text-critical' : 'shrink-0 text-attention'} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-label font-medium text-ink">{top.title}</span>
          <span className="block text-caption text-ink-muted">
            {rest > 0 ? `and ${rest} more need${rest === 1 ? 's' : ''} you` : 'Needs you'} · Review
          </span>
        </span>
        <ChevronRight size={16} strokeWidth={1.5} aria-hidden className="shrink-0 text-ink-muted" />
      </button>
    );
  }

  const salaryOn = formatSalaryDate(state.cycle.endDate);
  // Every claim here is one the absence of an insight actually supports: no SHORTFALL means no
  // account is projected short, no NEEDS_AMOUNT means nothing is unpriced. Where the shape still
  // reports an unpriced bill, the specific sentence would be a guess, so it falls back to the one
  // that is always true.
  const everythingPriced = state.shape.unknownAmountCount === 0;

  return (
    <div className="flex items-start gap-space-3">
      <CheckCircle2 size={16} strokeWidth={1.5} className="mt-[3px] shrink-0 text-positive" aria-hidden />
      <div className="flex min-w-0 flex-col gap-space-1">
        <p className="text-body text-ink">Nothing needs you today.</p>
        <p className="text-caption text-ink-muted">
          {everythingPriced
            ? `Every payment due before ${salaryOn} has an amount, and the account it leaves from covers it.`
            : 'Nothing is overdue, short or waiting on a decision.'}
        </p>
        {whatMoved?.map((line) => (
          <p key={line} className="text-caption text-ink-muted">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
