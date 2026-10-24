import { useState, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { UnknownState } from '@/components/UnknownState';
import { PositionBlockers } from '@/features/commitments/components/PositionBlockers';
import { AnimatedCollapse } from '@/components/AnimatedCollapse';
import { PositionStatement } from './PositionStatement';
import { PulseMetrics } from './PulseMetrics';
import { useAnimatedMoney } from '@/lib/useAnimatedMoney';
import { cn } from '@/lib/cn';
import { formatSalaryDate, shiftIsoDays } from '@/lib/dates';
import { useGetCycleForDateQuery } from '@/services/cycleService';
import { useGetCycleStandingQuery } from '@/services/commitmentInstanceService';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import type { FinancialStateResponse } from '@/types/financialState';

/**
 * **The Pulse** — where you stand, in six lines (ROADMAP 2.2).
 *
 * <p>Answering "where do I stand" used to need six screens: Today held the cash, Months the
 * plan, Money the debt and net worth, Needs you the warnings. Each was true; none was the
 * picture. This is the picture, and it reads from a single endpoint so the lines cannot
 * drift apart the way six separate reads could.
 *
 * <p><strong>Rendered as a statement, not a grid of tiles.</strong> The bar here is the
 * spreadsheet this replaced: one aligned column of figures, hairline rules, and the
 * derivation beside each line instead of behind a tap. Tiles would look more like an app and
 * read worse — the user's own verdict on an earlier build was that the Excel felt classier,
 * and this is what they meant.
 *
 * <p><strong>Line 1 sits outside the grid, and that was learned the hard way.</strong> Built
 * as the statement's own {@code hero} row it looked wrong on screen: the figure column is
 * narrow and right-aligned, so the big number floated mid-page with a hand's width of dead
 * space after its label, and its supporting line was marooned in the notes column. A hero
 * reads as one when the eye travels label → figure → meaning in a single downward move. So
 * line 1 is a block, lines 2–6 are the statement, and the statement's heavy top rule is what
 * divides them. Everything belonging to line 1 — the day figure, the expected salary, the
 * derivation — stays with it rather than trailing the table.
 *
 * <p>The notes column is the "traceable" half of the requirement: every line says in words
 * what produced it. Machine-readable provenance is 2.3.
 *
 * <p>Nothing is computed here. Every figure arrives worked out from the server
 * (FRONTEND_CONVENTIONS §4 rule 2); this file compares, formats and words them.
 */
export function Pulse({ state, isLoading }: { state: FinancialStateResponse | undefined; isLoading: boolean }) {
  const [open, setOpen] = useState(false);
  // Which row is showing its working. One at a time: the panel is the answer to a question
  // the user just asked, not a mode the statement sits in.
  const [why, setWhy] = useState<'runway' | 'debt' | null>(null);

  const position = state?.position;
  const animated = useAnimatedMoney(position?.state === 'OK' ? position.realBalance : null);
  const realBalanceDoc = useDocAnchor('position.real-balance');

  // The salary that lands at the end of this cycle, shown but never added in until it
  // arrives - the one piece of context the old hero carried that no other line does.
  const nextStart = state ? shiftIsoDays(state.cycle.endDate, 1) : null;
  const { data: nextCycle } = useGetCycleForDateQuery(nextStart ?? '', { skip: !nextStart });
  const { data: nextStanding } = useGetCycleStandingQuery(nextCycle?.id ?? 0, { skip: !nextCycle });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-3">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (!state || !position) {
    return <UnknownState reason="We couldn't reach the server, so this may be out of date." />;
  }

  const complete = position.state === 'OK';
  const negative = complete && Number(position.realBalance) < 0;
  const salaryOn = formatSalaryDate(state.cycle.endDate);
  const expected =
    nextStanding && Number(nextStanding.incomeExpectedTotal) > 0 ? nextStanding.incomeExpectedTotal : null;

  return (
    <section className="flex flex-col gap-space-5">
      {/* 1 — the number the whole product exists to protect.
          Deliberately *outside* the statement grid. Inside it, the hero was pushed into the
          narrow right-aligned figure column: the label stranded at the far left with a hand's
          width of dead space after it, and its own supporting line marooned in the notes
          column. A hero reads as a hero when the eye goes label → figure → meaning in one
          downward move, which is what this shape restores. */}
      {/* Context → figure → explanation, in that order and barely apart. The label leads
          because it is what the figure means; the figure follows because it is the answer;
          the day rate follows it because it is the consequence. ~70ms apart — read as one
          movement, not three events. */}
      <div className="flex flex-col gap-space-2">
        <span className="reveal text-micro uppercase tracking-[0.08em] text-ink-muted">
          Free until salary · {salaryOn}
        </span>
        {complete ? (
          <div className="reveal" style={{ '--reveal-delay': '70ms' } as CSSProperties} {...realBalanceDoc}>
            <Amount value={animated} role="hero" className={negative ? 'text-attention' : 'text-accent'} />
          </div>
        ) : (
          <UnknownState reason="Held back until every bill this month has an amount — a guess here would be worse than a gap." />
        )}
        {complete && negative && (
          <p
            className="reveal max-w-[34rem] text-body text-ink-soft"
            style={{ '--reveal-delay': '140ms' } as CSSProperties}
          >
            More is planned to leave before your next salary on {salaryOn} than you hold. Needs you shows where it runs
            short.
          </p>
        )}

        {position.state === 'INCOMPLETE' && <PositionBlockers blockers={position.blockers} />}

        {/* Everything about line 1 stays with line 1. These two used to sit *below* the whole
            statement, which left the hero's own working stranded five rows away from it. */}
        {expected && (
          <p className="reveal num text-caption text-ink-muted" style={{ '--reveal-delay': '190ms' } as CSSProperties}>
            Then salary: <Amount value={expected} role="caption" signed className="text-positive" /> expected on{' '}
            {salaryOn} — not counted until it arrives.
          </p>
        )}

        <div className="reveal mt-space-1" style={{ '--reveal-delay': '230ms' } as CSSProperties}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="pressable inline-flex items-center gap-space-1 rounded-md px-space-1 text-caption text-accent underline-offset-4 hover:underline"
          >
            How is this worked out?
            {/* The chevron turns faster than the panel opens, so the control answers the
                click before the content has finished arriving. */}
            <ChevronDown
              size={13}
              strokeWidth={1.75}
              aria-hidden
              className={cn('transition-transform duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)]', open && 'rotate-180')}
            />
          </button>
          <AnimatedCollapse open={open}>
            <div className="mt-space-4">
              <PositionStatement position={position} isLoading={false} />
            </div>
          </AnimatedCollapse>
        </div>
      </div>

      {/* Lines 2-6, grouped into three tiers by how often they are needed and what can be
          done about them - see `PulseMetrics`. The heavy rule is what separates the hero
          from the figures beneath it. */}
      <div className="border-t-2 border-ink pt-space-1">
        <PulseMetrics
          state={state}
          position={position}
          negative={negative}
          why={why}
          onWhy={setWhy}
        />
      </div>

    </section>
  );
}
