import { useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { Statement, StatementRow } from '@/components/Statement';
import { ProgressRule } from '@/components/ProgressRule';
import { Skeleton } from '@/components/Skeleton';
import { UnknownState } from '@/components/UnknownState';
import { PositionBlockers } from '@/features/commitments/components/PositionBlockers';
import { AnimatedCollapse } from '@/components/AnimatedCollapse';
import { PositionStatement } from './PositionStatement';
import { useAnimatedMoney } from '@/lib/useAnimatedMoney';
import { cn } from '@/lib/cn';
import { formatMoney, splitMoney } from '@/lib/money';
import { formatSalaryDate, shiftIsoDays } from '@/lib/dates';
import { useGetCycleForDateQuery } from '@/services/cycleService';
import { useGetCycleStandingQuery } from '@/services/commitmentInstanceService';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import type { FinancialStateResponse } from '@/types/financialState';

/**
 * **What you can still spend today** - Today's one figure, and the arithmetic that made it.
 *
 * <p>Replaces `Pulse`. The Pulse led with Real Balance, a 27-day figure, while the page it
 * sits on is called Today; the day's own number was row one of a seven-row table in caption
 * type. The user's verdict on 2026-11-01 was *"how much I am able to spend for today that
 * should be there"* and *"what numbers its showing how it came nothing is making sense"* -
 * both are the same complaint: the page answered a question other than its own, and never
 * showed its working beside the answer.
 *
 * <p><strong>The hero is {@code roomLeft}, not {@code realBalance} and not {@code perDay}.</strong>
 * It is the only one of the three that answers "what can I still spend, now": the day's share
 * with what has already gone today taken off it. {@code perDay} is the sustainable rate and
 * appears one line down as the *result* of the derivation; {@code realBalance} is where the
 * derivation starts.
 *
 * <p><strong>The derivation is on the page, not behind a disclosure.</strong> Three ruled
 * rows - free until salary, divided by days, a day from here - in one narrow measure with
 * dotted leaders. That is the whole "how did it come" answer and it costs three lines. What
 * stays behind the disclosure is the next level down: how Free until salary itself was built,
 * which is `PositionStatement` and was always there.
 *
 * <p><strong>The page holds one measure (44rem) and this block keeps it.</strong> The old
 * block right-aligned its figures across the full width of a 1440px window, which put a
 * hand's width of dead paper between a four-word label and its number - most of why the
 * screen read as misaligned. A narrower column was the first fix and was wrong in a second
 * way: three blocks at three widths give a ragged right edge, which is the same complaint
 * one level up. So the measure is shared with Before payday and Standing, and the gap that
 * remains is crossed by `Statement`'s dotted leaders, which is what they are for.
 *
 * <p>Nothing is computed here. Every rupee arrives worked out from the server
 * (FRONTEND_CONVENTIONS §4 rule 2); this file compares, words and formats. The one ratio
 * taken is the pacing rule's width - a proportion that sets a CSS length and is never shown
 * as money, the same allowance `PartPaidNote` already relies on.
 */
export function SpendToday({
  state,
  isLoading,
  status,
}: {
  state: FinancialStateResponse | undefined;
  isLoading: boolean;
  /**
   * What sits under the figure in the left column - `DayStatus`: the one thing worth
   * acting on, or the all-clear. A slot rather than a fetch of its own, so this file stays
   * about the money and the page decides what has earned the space beside it.
   */
  status?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const position = state?.position;
  const ok = position?.state === 'OK' ? position : null;
  // The one figure on this page that moves while the user is looking at it: recording an
  // expense changes it immediately. Nothing else here shifts faster than a day.
  const animated = useAnimatedMoney(ok?.roomLeft ?? null);
  const roomDoc = useDocAnchor('position.room');
  const realBalanceDoc = useDocAnchor('position.real-balance');

  // The salary that lands at the end of this cycle: shown, never added in until it arrives.
  const nextStart = state ? shiftIsoDays(state.cycle.endDate, 1) : null;
  const { data: nextCycle } = useGetCycleForDateQuery(nextStart ?? '', { skip: !nextStart });
  const { data: nextStanding } = useGetCycleStandingQuery(nextCycle?.id ?? 0, { skip: !nextCycle });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-56" />
        <Skeleton className="h-28 w-full max-w-[32rem]" />
      </div>
    );
  }
  if (!state || !position) {
    return <UnknownState reason="We couldn't reach the server, so this may be out of date." />;
  }

  const salaryOn = formatSalaryDate(state.cycle.endDate);
  const expected =
    nextStanding && Number(nextStanding.incomeExpectedTotal) > 0 ? nextStanding.incomeExpectedTotal : null;

  // Comparisons, not arithmetic. `negative` is the month-level failure - more is committed
  // before salary than is held, so there is no share to divide at all. `over` is the
  // ordinary one: today took more than its own slice, which is normal and not a verdict.
  const negative = ok != null && Number(ok.realBalance) < 0;
  const over = ok != null && Number(ok.roomLeft) < 0;
  const share = ok ? Number(ok.roomToday) : 0;
  const past = ok ? splitMoney(ok.roomLeft) : null;

  return (
    <section className="flex flex-col">
      {/* The summary band. `MonthOverview`'s idiom, which is the house pattern for "one
          block, two related halves": a 1fr figure column and a fixed-width panel beside it,
          divided by a rule rather than by a gap. The figure answers the question; the panel
          to its right shows the working. Below `lg` they stack and the rule turns
          horizontal, so the reading order never changes. */}
      <div className="grid grid-cols-1 gap-space-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-0">
        <div className="flex flex-col gap-space-2 lg:pr-space-8">
          <span className="reveal text-micro uppercase tracking-[0.08em] text-ink-muted">Spend today</span>

        {ok == null ? (
          <UnknownState reason="Held back until every bill this month has an amount - a guess here would be worse than a gap." />
        ) : negative ? (
          // A rate nobody can spend to is not a rate. The dash is the honest figure, and the
          // reason sits immediately under it rather than behind a tap.
          <>
            <Amount value={null} role="hero" />
            <p
              className="reveal max-w-[34rem] text-body text-ink-soft"
              style={{ '--reveal-delay': '70ms' } as CSSProperties}
            >
              Nothing to spread - more is committed before your salary on {salaryOn} than you hold. Needs you, below,
              shows where it runs short.
            </p>
          </>
        ) : (
          <>
            <div className="reveal" style={{ '--reveal-delay': '70ms' } as CSSProperties} {...roomDoc}>
              <Amount value={animated} role="hero" className={over ? 'text-attention' : 'text-accent'} />
            </div>

            {/* The share is named every time rather than left as a bare comparison: "₹75
                over" makes the reader work out over what, and the answer is a figure that is
                not otherwise on screen. And "left" is never negative - past the day's share
                the wording changes, because "-₹75 left today" reads as a fault rather than a
                fact about the day (the user asked exactly that on their second real day). */}
            <p
              className="reveal max-w-[34rem] text-body text-ink-soft"
              style={{ '--reveal-delay': '130ms' } as CSSProperties}
            >
              {Number(ok.spentToday) === 0 ? (
                <>Nothing spent yet today. Today&rsquo;s share is {formatMoney(ok.roomToday)}.</>
              ) : over ? (
                <>
                  {formatMoney(ok.spentToday)} spent today &mdash;{' '}
                  <span className="text-attention">
                    {past!.symbol}
                    {past!.digits} past
                  </span>{' '}
                  today&rsquo;s {formatMoney(ok.roomToday)} share. Nothing is blocked; tomorrow&rsquo;s share is a
                  little smaller.
                </>
              ) : (
                <>
                  {formatMoney(ok.spentToday)} spent of today&rsquo;s {formatMoney(ok.roomToday)} share.
                </>
              )}
            </p>

            {/* A rule, not a ring. A ring cannot show past 100%, and spending more than a
                day's share is normal rather than a failure (DESIGN_SYSTEM §12 rule 8) - a
                rule pins at full and the words above change instead. */}
            {share > 0 && (
              <ProgressRule
                fraction={Number(ok.spentToday) / share}
                className="reveal mt-space-2 max-w-[18rem]"
              />
            )}
          </>
        )}

          {position.state === 'INCOMPLETE' && <PositionBlockers blockers={position.blockers} />}

          {status}
        </div>

        {/* The derivation. Three rows with dotted leaders - the answer to "how did it come",
            on the page rather than behind a tap, and beside the figure rather than under it
            so the band reads as one summary across the full measure. */}
        {ok && (
          <div
            className="reveal border-t border-line pt-space-6 lg:border-l lg:border-t-0 lg:pl-space-8 lg:pt-0"
            style={{ '--reveal-delay': '220ms' } as CSSProperties}
          >
            <Statement leaders>
              <StatementRow
                label={<span {...realBalanceDoc}>Free until salary</span>}
                value={ok.realBalance}
                emphasiseNegative
              />
              <StatementRow
                label={`÷ days to ${salaryOn}`}
                valueNode={<span className="num text-row text-ink">{state.daysToSalary}</span>}
              />
              <StatementRow variant="total" label="A day from here" value={negative ? null : ok.perDay} accent />
            </Statement>

            {expected && (
              <p className="mt-space-3 text-caption text-ink-muted">
                Then salary: <Amount value={expected} role="caption" signed className="text-positive" /> expected on{' '}
                {salaryOn} &mdash; not counted until it arrives.
              </p>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="pressable mt-space-3 inline-flex items-center gap-space-1 rounded-md px-space-1 text-caption text-accent underline-offset-4 hover:underline"
            >
              How is {formatMoney(ok.realBalance)} worked out?
              {/* The chevron turns faster than the panel opens, so the control answers the
                  click before the content has finished arriving. */}
              <ChevronDown
                size={13}
                strokeWidth={1.75}
                aria-hidden
                className={cn(
                  'transition-transform duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                  open && 'rotate-180',
                )}
              />
            </button>
          </div>
        )}
      </div>

      {/* The full chain opens across the whole band, not inside the 28rem column that holds
          its trigger. `PositionStatement` renders `Statement notes`, whose third column is a
          fixed 22rem - in a 28rem track the label column squeezes to nothing and every row
          wraps one word per line (`FIX_BACKLOG` 4.8 is the same failure on the shell). The
          control belongs beside the figure it explains; the explanation needs the measure. */}
      {ok && (
        <AnimatedCollapse open={open}>
          <div className="pt-space-6">
            <PositionStatement position={position} isLoading={false} />
          </div>
        </AnimatedCollapse>
      )}
    </section>
  );
}
