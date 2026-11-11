import { useEffect, useState, type CSSProperties } from 'react';
import { Wallet } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGetFinancialStateQuery } from '@/services/financialStateService';
import { useGetTimelineQuery } from '@/services/timelineService';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetInsightsQuery } from '@/services/insightService';
import { SpendToday } from '@/features/today/components/SpendToday';
import { BeforePayday, useDatedWarnings } from '@/features/today/components/BeforePayday';
import { StandingPanel } from '@/features/today/components/StandingPanel';
import { TodayStatus } from '@/features/today/components/TodayStatus';
import { WayBack } from '@/features/today/components/WayBack';
import { PageHelpButton, PageSubtitle } from '@/features/help/PageHelp';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { formatMoney } from '@/lib/money';
import { formatFullDate, cycleProgressLabel, formatSalaryDate, shiftIsoDays } from '@/lib/dates';
import { useNeedsPanel } from '@/lib/needsPanel';

/**
 * Today - "what can I spend today, and is anything about to go wrong?"
 *
 * <p><strong>Revamped 2026-11-09</strong> (UI_UX_REVAMP_PLAN 4.1): one full-width column in
 * reading order - the day's figure and its three supporting facts, one status line, the way
 * back if the month has gone wrong, the next five payments, and everything long-horizon folded
 * away. Nothing on it is a second hero.
 *
 * <ul>
 *   <li>**Warnings moved to a panel.** The stack of cards that used to sit under the figure is
 *       the Needs-you panel now (`?needs=1`); this page keeps one status line that opens it.
 *       A shortfall attached to a payment row stays on that row and is not counted twice.</li>
 *   <li>**Standing is closed by default.** Net worth, runway and owed move over years and are
 *       not decisions anyone takes at 11am.</li>
 *   <li>**The proof is a tap away, not on the page.** "How is ₹X worked out?" opens the
 *       Breakdown (registry B1).</li>
 *   <li>**Way back** renders itself only when the recovery engine has something to say, and
 *       sits directly under the figure because then it *is* the answer.</li>
 * </ul>
 *
 * <p>Insights are fetched here rather than only inside the panel so a dated shortfall can be
 * attached to the payment row it breaks and then excluded from the status count. RTK Query
 * dedupes the subscriptions into one request.
 */
export default function TodayPage() {
  const { show: showNeeds } = useNeedsPanel();
  // Arriving from setup: one welcome line, once. The router state is cleared straight away so a
  // refresh or Back does not greet the user a second time.
  const location = useLocation();
  const navigate = useNavigate();
  const [welcome] = useState(() => (location.state as { welcome?: boolean } | null)?.welcome === true);
  useEffect(() => {
    if (welcome) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: accountsPage, isLoading: accountsLoading } = useGetAccountsQuery();
  // One read for the whole page's money. Today does not fetch position separately: two reads of
  // the same money are two chances to show different figures on one screen.
  const { data: financialState, isLoading: stateLoading, fulfilledTimeStamp } = useGetFinancialStateQuery();
  const { data: timeline, isLoading: timelineLoading, isError: timelineError } = useGetTimelineQuery({ days: 45 });
  const { data: insights } = useGetInsightsQuery('TODAY');

  const accounts = accountsPage?.content ?? [];
  const cycle = financialState?.cycle;
  // Payday is the day after the cycle's last - the salary that starts the next one.
  const salaryDate = cycle ? shiftIsoDays(cycle.endDate, 1) : null;
  const { byRow, consumed } = useDatedWarnings(timeline, insights?.items);

  // What the status line counts: urgent items not already shown on a payment row. Informational
  // items never make this line say "needs you" - they are in the panel under "Worth knowing".
  const needs = (insights?.items ?? []).filter(
    (i) => !consumed.includes(i.key) && (i.severity === 'CRITICAL' || i.severity === 'ATTENTION'),
  );

  if (!accountsLoading && accounts.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        headline="Your financial picture starts here."
        body="Add your accounts so we can tell you what's actually yours to spend."
        action={
          <Link to="/accounts" className="text-label text-accent hover:underline underline-offset-4">
            Add an account
          </Link>
        }
      />
    );
  }

  const committed = financialState?.position.state === 'OK' ? financialState.position.breakdown.committed : null;

  return (
    // The shell settles first and slightly slower than its contents, so the figures arrive
    // *within* the page rather than racing it (DESIGN_SYSTEM §10).
    <div className="reveal-shell flex w-full flex-col gap-space-6 md:gap-10">
      <header className="flex flex-col gap-space-1">
        <div className="flex items-center justify-between gap-space-4">
          <h1 className="text-page text-ink">Today</h1>
          <PageHelpButton topic="today.how-today-works" />
        </div>
        <PageSubtitle>What’s left of today’s share, and what stands between you and payday.</PageSubtitle>
        {welcome && (
          <p className="reveal mt-space-3 max-w-[34rem] font-serif text-editorial text-ink">
            Welcome to Kosh. Here is what you can spend today.
          </p>
        )}
        <p className="num mt-space-1 text-caption text-ink-muted">
          {formatFullDate()}
          {/* The date range lives on Month; here the day count is the useful part. */}
          {cycle && <> · {cycleProgressLabel(cycle.startDate, cycle.endDate).split(' · ').pop()}</>}
        </p>
      </header>

      <div className="flex flex-col gap-space-4 md:gap-space-6">
        <SpendToday state={financialState} isLoading={stateLoading} asOf={fulfilledTimeStamp} />

        {financialState && (
          <div className="reveal w-full" style={{ '--reveal-delay': '300ms' } as CSSProperties}>
            <TodayStatus needs={needs} state={financialState} whatMoved={insights?.whatMoved} onOpen={showNeeds} />
          </div>
        )}

        <div className="w-full">
          <WayBack />
        </div>
      </div>

      <section className="reveal" style={{ '--reveal-delay': '380ms' } as CSSProperties}>
        <SectionHeader
          overCard
          trailing={
            committed && cycle ? (
              <>
                <span className="max-md:hidden">
                  {formatMoney(committed)} still to leave · salary {formatSalaryDate(cycle.endDate)}
                </span>
                <span className="num md:hidden">{formatMoney(committed)} to leave</span>
              </>
            ) : undefined
          }
        >
          Before payday
        </SectionHeader>
        <div className="m-card">
          <BeforePayday
            items={timeline}
            isLoading={timelineLoading}
            isError={timelineError}
            salaryDate={salaryDate}
            warnings={byRow}
          />
        </div>
      </section>

      {financialState && (
        <div className="reveal" style={{ '--reveal-delay': '440ms' } as CSSProperties}>
          <StandingPanel state={financialState} />
        </div>
      )}
    </div>
  );
}
