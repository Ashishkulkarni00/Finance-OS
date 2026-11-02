import type { CSSProperties } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { InsightRow } from '@/components/InsightList';
import { formatSalaryDate } from '@/lib/dates';
import type { InsightItem } from '@/types/insight';
import type { FinancialStateResponse } from '@/types/financialState';

/**
 * The slot under the day's figure: **the one thing worth acting on, or the all-clear.**
 *
 * <p>Fills the space the hero left beneath it - the user's own observation, and a fair one:
 * a 40px figure and two lines of caption leave most of a 600px column empty, right next to
 * the part of the screen the eye lands on first. What belongs there is the single most
 * urgent thing, because that is the only content that earns a place beside "what can I
 * spend".
 *
 * <p><strong>Promoted, not duplicated.</strong> The item shown here is removed from the
 * rail's Needs-you list by key, exactly as a dated shortfall is removed when it attaches to
 * its payment row. Saying the same warning twice on one screen is how a list stops being
 * read.
 *
 * <p><strong>The all-clear states a fact, it does not congratulate.</strong> "Great job,
 * everything's sorted" was the ask, and the wording here deliberately goes a step past it.
 * Praise for a quiet day is hollow - most quiet days are the plan working, not something
 * the user did this morning - and a product that congratulates you on a schedule teaches
 * you to discount it, which is the same nag fatigue in a friendlier coat (DESIGN_SYSTEM §12
 * rule 8: never judge, in either direction). So the headline is the achievement framing
 * `SCREEN_SPECS` S1 already specified - *"an achievement, not a void"* - and the line under
 * it says **why** it is clear. A reason is more satisfying than a compliment, and it is
 * still true on the day it stops being clear.
 *
 * <p><strong>It is shown only when there is genuinely nothing</strong>, counting the
 * warnings that moved elsewhere on the page. A green tick above a shortfall sitting in
 * *Before payday* would be the worst sentence this screen could print.
 */
export function DayStatus({
  item,
  state,
  whatMoved,
  revealDelay = 300,
}: {
  /** The highest-ranked warning not already shown elsewhere on the page. */
  item: InsightItem | undefined;
  state: FinancialStateResponse;
  /** The server's "what went right" lines, which it withholds whenever anything is urgent. */
  whatMoved: string[] | undefined;
  revealDelay?: number;
}) {
  if (item) {
    return (
      <div className="mt-space-5">
        <InsightRow item={item} revealDelay={revealDelay} />
      </div>
    );
  }

  const salaryOn = formatSalaryDate(state.cycle.endDate);
  // Every claim here is one the absence of an insight actually supports: no SHORTFALL means
  // no account is projected short, no NEEDS_AMOUNT means nothing is unpriced. Where the
  // shape still reports an unpriced bill, the specific sentence would be a guess, so it
  // falls back to the one that is always true.
  const everythingPriced = state.shape.unknownAmountCount === 0;

  return (
    <div
      className="reveal mt-space-5 flex items-start gap-space-3 rounded-xl p-space-4"
      style={
        {
          backgroundColor: 'color-mix(in srgb, var(--positive) 7%, var(--surface))',
          '--reveal-delay': `${revealDelay}ms`,
        } as CSSProperties
      }
    >
      <CheckCircle2 size={18} strokeWidth={1.5} className="mt-[0.1rem] shrink-0 text-positive" aria-hidden />
      <div className="flex min-w-0 flex-col gap-space-1">
        <p className="text-body text-ink">Nothing needs you today.</p>
        <p className="text-caption text-ink-soft">
          {everythingPriced
            ? `Every payment due before ${salaryOn} has an amount, and the account it leaves from covers it.`
            : 'Nothing is overdue, short or waiting on a decision.'}
        </p>
        {/* What moved, when nothing is urgent (ROADMAP 3.3). The server withholds these
            entirely while anything is wrong, so there is no judgement to make here - and
            the rail's Needs-you section is not rendered in this state, so they are shown
            once, not twice. */}
        {whatMoved?.map((line) => (
          <p key={line} className="text-caption text-ink-muted">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
