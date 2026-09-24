import { useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Amount } from '@/components/Amount';
import { Statement, StatementRow } from '@/components/Statement';
import { Skeleton } from '@/components/Skeleton';
import { UnknownState } from '@/components/UnknownState';
import { PositionBlockers } from '@/features/commitments/components/PositionBlockers';
import { AnimatedCollapse } from '@/components/AnimatedCollapse';
import { PositionStatement } from './PositionStatement';
import { BasisPanel } from './BasisPanel';
import { useAnimatedMoney } from '@/lib/useAnimatedMoney';
import { cn } from '@/lib/cn';
import { formatMoney, formatPercent } from '@/lib/money';
import { formatDayMonthYear, formatSalaryDate, shiftIsoDays } from '@/lib/dates';
import { useGetCycleForDateQuery } from '@/services/cycleService';
import { useGetCycleStandingQuery } from '@/services/commitmentInstanceService';
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

  const { shape, netWorth, runway, debt, baseline } = state;
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
          <div className="reveal" style={{ '--reveal-delay': '70ms' } as CSSProperties}>
            <Amount value={animated} role="hero" className={negative ? 'text-attention' : 'text-accent'} />
          </div>
        ) : (
          <UnknownState reason="Held back until every bill this month has an amount — a guess here would be worse than a gap." />
        )}
        {complete && (
          <p
            className="reveal num max-w-[34rem] text-body text-ink-soft"
            style={{ '--reveal-delay': '140ms' } as CSSProperties}
          >
            {negative ? (
              'More is planned to leave before salary than you hold. Needs you shows where it runs short.'
            ) : (
              <>
                <Amount value={position.roomToday} role="body" className="text-ink" /> a day for {state.daysToSalary}{' '}
                {state.daysToSalary === 1 ? 'day' : 'days'} ·{' '}
                <Amount value={position.roomLeft} role="body" className="text-ink" /> left today
              </>
            )}
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

      {/* Lines 2-6. The heavy rule is the statement's own top edge, and it is what separates
          the hero from the ledger beneath it. */}
      <Statement notes leaders className="border-t-2 border-ink">
        {/* 2 — the month in one line, the same figures Months leads with. */}
        <StatementRow
          label="Free this month"
          revealDelay={300}
          value={shape.flexible}
          note={
            shape.flexible == null
              ? `${shape.unknownAmountCount} ${shape.unknownAmountCount === 1 ? 'bill has' : 'bills have'} no amount yet.`
              : Number(shape.committed) === 0 && Number(shape.plannedSavings) === 0
                ? // Without this, a month with no plan shows a large "free" figure directly
                  // under a much smaller "free until salary" and reads as a contradiction.
                  // It is not one - nothing is planned in this month, which is worth saying.
                  'Nothing planned this month'
                : `${formatMoney(shape.expectedIn)} in · ${formatMoney(shape.committed)} committed · ${formatMoney(shape.plannedSavings)} set aside`
          }
        />

        {/* 3 — safety. Deliberately not comparable to line 1: this counts the emergency
            fund, which Free until salary excludes by design. */}
        <StatementRow
          label={<WhyLabel text="If income stopped" open={why === 'runway'} onClick={() => setWhy(why === 'runway' ? null : 'runway')} />}
          revealDelay={355}
          valueNode={
            runway.months == null ? (
              <span className="text-row text-ink-muted">—</span>
            ) : (
              <span className="inline-flex items-baseline gap-[0.3em]">
                {runway.upperBound && <span className="text-caption text-ink-muted">at most</span>}
                <span className="num text-row text-ink">{runway.months}</span>
                <span className="text-caption text-ink-muted">{runway.months === 1 ? 'month' : 'months'}</span>
              </span>
            )
          }
          note={
            runway.months == null
              ? runway.unknownReason
              : `${formatMoney(runway.liquidTotal)} reachable · ${formatMoney(runway.monthlyEssentials)} must-pay a month · day-to-day on top${
                  runway.unknownBillCount > 0 ? ` · ${runway.unknownBillCount} unpriced` : ''
                }`
          }
        />

        {why === 'runway' && runway.basis && <BasisSpan><BasisPanel basis={runway.basis} /></BasisSpan>}

        {/* 4 — debt as one position rather than five loans. */}
        <StatementRow
          label={<WhyLabel text="Owed" open={why === 'debt'} onClick={() => setWhy(why === 'debt' ? null : 'debt')} />}
          revealDelay={410}
          value={debt.totalOutstanding}
          note={
            <>
              {debt.emiShareOfIncome != null && `${formatPercent(debt.emiShareOfIncome)} of income to EMIs`}
              {debt.emiShareOfIncome != null && debt.debtFreeDate && ' · '}
              {/* formatDayMonthYear, not formatSalaryDate: that one takes a cycle *end* and adds
                  a day to find payday, and it drops the year - on a date three years out the
                  year is the whole point. */}
              {debt.debtFreeDate && `clear ${formatDayMonthYear(debt.debtFreeDate)}`}
              {debt.loansWithoutTerms > 0 &&
                ` · ${debt.loansWithoutTerms} without terms`}
            </>
          }
        />

        {why === 'debt' && debt.basis && <BasisSpan><BasisPanel basis={debt.basis} /></BasisSpan>}

        {/* 5 — the long view, stated once and not dwelt on. */}
        <StatementRow
          label="Net worth"
          revealDelay={465}
          value={netWorth.netWorth}
          emphasiseNegative
          note={`${formatMoney(netWorth.totalAssets)} held · ${formatMoney(netWorth.totalLiabilities)} owed`}
        />

        {/* 6 — the only line that asks for anything. */}
        <StatementRow
          variant="subtotal"
          label="Needs you"
          revealDelay={520}
          valueNode={
            <Link to="/needs-you" className="num text-row text-ink underline-offset-4 hover:underline">
              {state.attentionCount}
            </Link>
          }
          note={
            state.attentionCount === 0
              ? 'Nothing waiting on a decision'
              : baseline.perCycle == null
                ? `${state.attentionCount === 1 ? 'One thing' : `${state.attentionCount} things`} to look at`
                : `${state.attentionCount === 1 ? 'One thing' : `${state.attentionCount} things`} to look at · you usually spend ${formatMoney(baseline.perCycle)} a month`
          }
        />
      </Statement>

    </section>
  );
}

/** A label that offers its own derivation. Underlined on hover only - a statement peppered
 *  with permanent links reads as a web page, not a ledger. */
function WhyLabel({ text, open, onClick }: { text: string; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="inline-flex items-center gap-space-1 text-left underline-offset-4 hover:underline"
    >
      {text}
      <ChevronDown
        size={12}
        strokeWidth={1.75}
        aria-hidden
        className={cn('shrink-0 text-ink-muted transition-transform duration-150', open && 'rotate-180')}
      />
    </button>
  );
}

/** The derivation belongs under its row and across every column - the grid is
 *  `display: contents` rows, so a full-width panel has to say so explicitly. */
function BasisSpan({ children }: { children: ReactNode }) {
  return <div style={{ gridColumn: '1 / -1' }}>{children}</div>;
}
