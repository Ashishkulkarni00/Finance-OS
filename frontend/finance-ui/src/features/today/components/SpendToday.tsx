import type { CSSProperties } from 'react';
import { ChevronRight } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { Breakdown } from '@/components/Breakdown';
import { ProgressRule } from '@/components/ProgressRule';
import { Skeleton } from '@/components/Skeleton';
import { UnknownState } from '@/components/UnknownState';
import { PositionBlockers } from '@/features/commitments/components/PositionBlockers';
import { PositionStatement } from './PositionStatement';
import { PositionTrio } from './PositionTrio';
import { useAnimatedMoney } from '@/lib/useAnimatedMoney';
import { formatClock, formatSalaryDate, shiftIsoDays } from '@/lib/dates';
import { formatMoney, splitMoney } from '@/lib/money';
import { cn } from '@/lib/cn';
import { useAppSelector } from '@/store/hooks';
import { useGetCycleForDateQuery } from '@/services/cycleService';
import { useGetCycleStandingQuery } from '@/services/commitmentInstanceService';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import type { FinancialStateResponse } from '@/types/financialState';

/**
 * Today's answer - UI_UX_REVAMP_PLAN 4.1. One column: the day's figure, one sentence, then the
 * working as a fact strip with the proof one tap behind it.
 *
 * <p><strong>The hero is {@code roomLeft}, not {@code realBalance} and not {@code perDay}.</strong>
 * "How much can I spend today" is what the person opens this screen to ask; the month-sized
 * figures are the supporting evidence under it (Free until salary / Days / A day from here).
 * Every figure is a server field, and the proof (held - reserved - committed - card dues) opens
 * from "How is ₹X worked out?" as a Breakdown - registry B1, UI_UX_REVAMP_PLAN 6.4.
 *
 * <p><strong>While the server is unreachable the hero is marked stale</strong> (it loses its
 * accent and says when it was last confirmed) so an old figure is never read as today's.
 */
export function SpendToday({
  state,
  isLoading,
  asOf,
}: {
  state: FinancialStateResponse | undefined;
  isLoading: boolean;
  /** When this data last arrived (RTK `fulfilledTimeStamp`). Shown only in connectivity mode. */
  asOf?: number;
}) {
  const offline = useAppSelector((s) => s.connectivity.offline);
  const position = state?.position;
  const ok = position?.state === 'OK' ? position : null;
  // The one figure on this page that moves while the user is looking at it: recording an
  // expense changes it immediately.
  const animated = useAnimatedMoney(ok?.roomLeft ?? null);
  const roomDoc = useDocAnchor('position.room');

  // The salary that lands at the end of this cycle: shown, never added in until it arrives.
  const nextStart = state ? shiftIsoDays(state.cycle.endDate, 1) : null;
  const { data: nextCycle } = useGetCycleForDateQuery(nextStart ?? '', { skip: !nextStart });
  const { data: nextStanding } = useGetCycleStandingQuery(nextCycle?.id ?? 0, { skip: !nextCycle });

  if (isLoading) {
    return (
      <div className="m-card flex flex-col gap-space-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-5 w-72" />
        <Skeleton className="mt-space-3 h-16 w-full" />
      </div>
    );
  }
  if (!state || !position) {
    return <UnknownState reason="We couldn't reach the server, so this may be out of date." />;
  }

  const salaryOn = formatSalaryDate(state.cycle.endDate);
  const expected = nextStanding && Number(nextStanding.incomeExpectedTotal) > 0 ? nextStanding.incomeExpectedTotal : null;

  // Comparisons, not arithmetic. `negative` is the month-level failure - more is committed
  // before salary than is held, so there is no share to divide at all. `over` is the ordinary
  // one: today took more than its own slice, which is normal and not a verdict.
  const negative = ok != null && Number(ok.realBalance) < 0;
  const over = ok != null && Number(ok.roomLeft) < 0;
  const share = ok ? Number(ok.roomToday) : 0;
  const past = ok ? splitMoney(ok.roomLeft) : null;

  const heroTone = offline ? 'text-ink-soft' : over ? 'text-attention' : 'text-accent';

  return (
    <section className="m-card flex flex-col">
      <div className="flex items-center justify-between gap-space-3">
        <span className="reveal text-caption text-ink-muted">{negative ? 'Short until salary' : 'Spend today'}</span>
        {/* On a phone the day count rides beside the label as a chip rather than inside a
            sentence - the card is read in a glance, not paragraph by paragraph. */}
        {ok && (
          <span className="num shrink-0 rounded-full bg-sunken px-space-3 py-[3px] text-caption text-ink-soft md:hidden">
            {state.daysToSalary} {state.daysToSalary === 1 ? 'day' : 'days'} to salary
          </span>
        )}
      </div>

      {ok == null ? (
        <UnknownState reason="Held back until every bill this month has an amount - a guess here would be worse than a gap." />
      ) : negative ? (
        // No share to divide, so no daily figure - but the month-level fact is a real number and
        // is the thing to show: how far short, in the server's own `realBalance`. A bare dash told
        // the user nothing was wrong without saying what (2026-11-10: "just a single line, not an
        // amount"). Amber, not red, and no verdict - it is a fact about the month, not a fault.
        <>
          <div className="reveal mt-space-1" style={{ '--reveal-delay': '70ms' } as CSSProperties} {...roomDoc}>
            <Amount value={ok.realBalance} role="hero" className={offline ? 'text-ink-soft' : 'text-attention'} />
          </div>
          <p className="reveal mt-space-2 max-w-[34rem] text-body text-ink-soft max-md:hidden" style={{ '--reveal-delay': '130ms' } as CSSProperties}>
            More is promised before your salary on {salaryOn} than you have free, so there&rsquo;s no daily share for
            the {state.daysToSalary} days left. Nothing is blocked.
          </p>
          <p className="reveal mt-space-1 text-label text-ink-soft md:hidden" style={{ '--reveal-delay': '130ms' } as CSSProperties}>
            More is due before salary than you have free. Nothing is blocked.
          </p>
        </>
      ) : (
        <>
          <div className="reveal mt-space-1" style={{ '--reveal-delay': '70ms' } as CSSProperties} {...roomDoc}>
            <Amount value={animated} role="hero" className={heroTone} />
          </div>

          {offline && asOf != null && (
            <p className="num mt-space-1 text-caption text-attention">As of {formatClock(asOf)}. May be out of date.</p>
          )}

          {/* The share is named every time rather than left as a bare comparison, and "left" is
              never negative: past the day's share the wording changes, because "-₹75 left today"
              reads as a fault rather than a fact about the day. */}
          <p className="reveal mt-space-2 max-w-[34rem] text-body text-ink-soft" style={{ '--reveal-delay': '130ms' } as CSSProperties}>
            {Number(ok.spentToday) === 0 ? (
              <>Nothing spent yet today. Today&rsquo;s share is {formatMoney(ok.roomToday)}.</>
            ) : over ? (
              <>
                {formatMoney(ok.spentToday)} spent today &mdash;{' '}
                <span className="text-attention">
                  {past!.symbol}
                  {past!.digits} past
                </span>{' '}
                today&rsquo;s {formatMoney(ok.roomToday)} share. Nothing is blocked; tomorrow&rsquo;s share is a little smaller.
              </>
            ) : (
              <>
                {formatMoney(ok.spentToday)} spent of today&rsquo;s {formatMoney(ok.roomToday)} share.
              </>
            )}
          </p>

          {/* A rule, not a ring. A ring cannot show past 100%, and spending more than a day's
              share is normal rather than a failure - a rule pins at full and the words change. */}
          {share > 0 && <ProgressRule fraction={Number(ok.spentToday) / share} className="reveal mt-space-3 max-w-[18rem]" />}
        </>
      )}

      {position.state === 'INCOMPLETE' && <PositionBlockers blockers={position.blockers} />}

      {ok && (
        <div className="reveal mt-space-4 md:mt-space-5" style={{ '--reveal-delay': '220ms' } as CSSProperties}>
          {/* Short of zero the hero already *is* Free until salary, and "a day from here" has
              nothing to show - the strip would only print the shortfall a second time. */}
          {!negative && (
            <PositionTrio free={ok.realBalance} days={state.daysToSalary} perDay={ok.perDay} salaryOn={salaryOn} />
          )}
          {/* Phone: the proof and the salary as two list rows across the card's foot, each a
              full-width tap target, instead of a link and a sentence. */}
          <div className={cn('-mx-space-4 -mb-space-4 md:hidden', negative && '-mt-space-1')}>
            <Breakdown
              title="Where you stand"
              trigger={
                <>
                  <span className="text-label text-ink">How it&rsquo;s worked out</span>
                  <ChevronRight size={16} strokeWidth={1.5} aria-hidden className="shrink-0 text-ink-muted" />
                </>
              }
              asOf={offline && asOf != null ? formatClock(asOf) : undefined}
              className="trigger-row flex w-full items-center justify-between gap-space-3 rounded-none border-t border-line px-space-4 py-space-3"
            >
              <PositionStatement position={position} isLoading={false} bare />
            </Breakdown>
            {expected && (
              <div className="flex items-center justify-between gap-space-3 border-t border-line px-space-4 py-space-3">
                <span className="min-w-0">
                  <span className="block text-label text-ink">Next salary</span>
                  <span className="block text-caption text-ink-muted">{salaryOn} · not counted until it arrives</span>
                </span>
                <Amount value={expected} role="row" signed className="shrink-0 text-positive" />
              </div>
            )}
          </div>

          <div className={cn('hidden text-caption md:flex md:flex-row md:flex-wrap md:items-baseline md:gap-x-space-4', negative ? 'mt-0' : 'mt-space-3')}>
            {/* Registry B1 (UI_UX_REVAMP_PLAN 6.4): held, reserved, committed and card dues are the
                server's own lines and Free until salary is the server's own total. */}
            <span className="text-accent">
              <Breakdown
                title="Where you stand"
                trigger={<>How is {formatMoney(ok.realBalance)} worked out?</>}
                asOf={offline && asOf != null ? formatClock(asOf) : undefined}
              >
                <PositionStatement position={position} isLoading={false} bare />
              </Breakdown>
            </span>
            {expected && (
              <span className="text-ink-muted">
                Then salary <Amount value={expected} role="caption" signed className="text-positive" /> on {salaryOn}, not
                counted until it arrives.
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

