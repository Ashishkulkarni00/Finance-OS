import type { CSSProperties, ReactNode } from 'react';
import { CalendarDays } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { UnknownState } from '@/components/UnknownState';
import { PositionBlockers } from '@/features/commitments/components/PositionBlockers';
import { SalaryPanel } from './SalaryPanel';
import { WhereYouStand } from './WhereYouStand';
import { useAnimatedMoney } from '@/lib/useAnimatedMoney';
import { cycleProgress, formatClock, formatFullDate } from '@/lib/dates';
import { useAppSelector } from '@/store/hooks';
import { useGetRecoveryQuery } from '@/services/recoveryService';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import type { FinancialStateResponse } from '@/types/financialState';

/**
 * Today's top - everything above "Needs you" (redesign 2026-11-11, from the user's brief).
 *
 * <p>Three blocks, in the order a person asks the questions:
 * <ol>
 *   <li><strong>The hero</strong> - the figure, what it means in a few plain words, the date, and how
 *       far through the salary month we are.</li>
 *   <li><strong>The salary panel</strong> - how long until salary, when, and how today's share and the
 *       usual daily rate compare (`SalaryPanel`).</li>
 *   <li><strong>Where you stand</strong> - the working behind the figure (`WhereYouStand`).</li>
 * </ol>
 *
 * <p>Four states, every value a server field and every choice a comparison:
 * <ul>
 *   <li><strong>A</strong> room left today: `roomLeft`, "left to spend today".</li>
 *   <li><strong>B</strong> today's share is used: `perDay`, "to spend each day until salary". A negative
 *       "left today" is a verdict on a moment that has passed; what each remaining day is worth is
 *       the figure that can still be acted on.</li>
 *   <li><strong>C</strong> short until salary: `realBalance`, in attention.</li>
 *   <li><strong>D</strong> unknown: held back until every bill has an amount.</li>
 * </ul>
 * What was spent today is not in the hero; it is the header of the Today group further down.
 *
 * <p>While the server is unreachable the figure loses its accent and says when it was last
 * confirmed, so an old figure is never read as today's. No greeting and no illustration: nothing
 * here is decoration.
 */
export function SpendToday({
  state,
  isLoading,
  asOf,
  corner,
}: {
  state: FinancialStateResponse | undefined;
  isLoading: boolean;
  /** When this data last arrived (RTK `fulfilledTimeStamp`). Shown only in connectivity mode. */
  asOf?: number;
  /** The page's help icon, on the figure's row. */
  corner?: ReactNode;
}) {
  const offline = useAppSelector((s) => s.connectivity.offline);
  const position = state?.position;
  const ok = position?.state === 'OK' ? position : null;
  const roomDoc = useDocAnchor('position.room');
  const { data: recovery } = useGetRecoveryQuery();

  const negative = ok != null && Number(ok.realBalance) < 0;
  const used = ok != null && !negative && Number(ok.roomLeft) <= 0;
  // The one figure on this page that moves while the user is looking at it.
  const animated = useAnimatedMoney(ok ? (used ? ok.perDay : negative ? ok.realBalance : ok.roomLeft) : null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-4">
        <div className="flex items-start justify-between gap-space-3">
          <Skeleton className="h-16 w-56" />
          {corner}
        </div>
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }
  if (!state || !position) {
    return <UnknownState reason="We couldn't reach the server, so this may be out of date." />;
  }

  // Only the SPEND_LESS step carries a per-day figure, and only a stretched month says it.
  const belowUsual =
    recovery?.state === 'STRETCHED' ? (recovery.steps.find((s) => s.kind === 'SPEND_LESS')?.perDayLess ?? null) : null;
  const catchUp = recovery && recovery.catchUp != null && Number(recovery.catchUp) > 0 ? recovery : null;
  const progress = cycleProgress(state.cycle.startDate, state.cycle.endDate);

  const heroTone = offline ? 'text-ink-soft' : negative ? 'text-attention' : 'text-accent';
  const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as CSSProperties;

  return (
    <section className="flex flex-col gap-space-4">
      {/* The page's heading, for screen readers and the outline: the figure is what sighted users read as the title. */}
      <h1 className="sr-only">Today</h1>

      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-space-3">
          {ok == null ? (
            <span className="reveal text-caption text-ink-muted">Spend today</span>
          ) : (
            <div className="reveal min-w-0" style={delay(0)} {...roomDoc}>
              <Amount value={animated} role="display" className={heroTone} />
            </div>
          )}
          {corner}
        </div>

        {ok == null ? (
          <UnknownState reason="Held back until every bill this month has an amount - a guess here would be worse than a gap." />
        ) : (
          <>
            <p className="reveal mt-space-1 text-body text-ink-soft" style={delay(50)}>
              {negative ? 'short until salary' : used ? 'to spend each day until salary' : 'left to spend today'}
            </p>
            {offline && asOf != null && (
              <p className="num mt-space-1 text-caption text-attention">As of {formatClock(asOf)}. May be out of date.</p>
            )}
          </>
        )}

        {/* The date, and how far through the salary month: a slim rule, the elapsed part in the accent. */}
        <div className="reveal mt-space-4 flex max-w-[44rem] flex-col gap-space-2" style={delay(90)}>
          <div className="flex items-center justify-between gap-space-3 text-caption">
            <span className="inline-flex min-w-0 items-center gap-space-2 text-ink-soft">
              <CalendarDays size={14} strokeWidth={1.5} aria-hidden className="shrink-0 text-ink-muted" />
              <span className="truncate">{formatFullDate()}</span>
            </span>
            <span className="num shrink-0 text-ink-muted">
              Day {progress.dayOfCycle} of {progress.totalDays}
            </span>
          </div>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-sunken" aria-hidden>
            <div className="h-full rounded-full bg-accent/70" style={{ width: `${Math.round(progress.fraction * 100)}%` }} />
          </div>
        </div>
      </div>

      {position.state === 'INCOMPLETE' && <PositionBlockers blockers={position.blockers} />}

      <div className="reveal max-w-[44rem]" style={delay(130)}>
        <SalaryPanel
          daysToSalary={state.daysToSalary}
          cycleEnd={state.cycle.endDate}
          roomToday={ok?.roomToday ?? null}
          spentToday={ok?.spentToday ?? null}
          used={used}
          belowUsual={belowUsual}
          showStats={ok != null && !negative}
        />
        {negative && (
          <p className="mt-space-2 text-caption text-ink-muted">More is due before salary than you have free. Nothing is blocked.</p>
        )}
      </div>

      {ok && (
        <div className="reveal flex flex-col gap-space-2" style={delay(170)}>
          <WhereYouStand position={ok} />
          {catchUp && (
            <p className="max-w-[44rem] text-caption text-ink-muted">
              {catchUp.catchUpMonths != null && catchUp.catchUpPerMonth ? (
                <>
                  Putting back <Amount value={catchUp.catchUp} role="caption" className="text-ink" /> afterwards takes{' '}
                  {catchUp.catchUpMonths === 1 ? 'next month' : `${catchUp.catchUpMonths} months`} at{' '}
                  <Amount value={catchUp.catchUpPerMonth} role="caption" className="text-ink" /> a month, still leaving
                  your usual day-to-day spending.
                </>
              ) : (
                <>
                  <Amount value={catchUp.catchUp} role="caption" className="text-ink" /> would need putting back
                  afterwards &mdash; the months ahead don&rsquo;t leave room above usual spending for it yet.
                </>
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
