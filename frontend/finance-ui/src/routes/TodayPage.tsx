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
import { NeedsYou } from '@/features/today/components/NeedsYou';
import { TodayEntries } from '@/features/today/components/TodayEntries';
import { PageHelpButton } from '@/features/help/PageHelp';
import { EmptyState } from '@/components/EmptyState';
import { SectionRule } from '@/components/SectionRule';
import { formatMoney } from '@/lib/money';
import { shiftIsoDays } from '@/lib/dates';
import { useNeedsPanel } from '@/lib/needsPanel';

/**
 * Today - "what can I spend today, and is anything about to go wrong?"
 *
 * <p><strong>Rebuilt 2026-11-11 in the Ledger's grammar</strong> (TODAY_HERO_SPEC): no cards,
 * bands or boxes above Standing. Every block is either a row shaped like a `LedgerRow` or a
 * group header shaped like the Ledger's day header; the one exception is the hero figure.
 * Reading order: the figure and its working, what needs you, what today has cost (the Ledger's
 * own day group), what leaves before payday, and - closed off by the user's choice, unchanged -
 * how you stand.
 *
 * <p>Insights are fetched here rather than only inside the panel so the dated shortfall can be
 * flagged on the payment row it breaks. RTK Query dedupes the subscriptions into one request.
 * The flag is only a flag: the warning is said once, fully, in Needs you, and the count there is
 * the count on the nav badge.
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
  const { byRow } = useDatedWarnings(timeline, insights?.items);

  // Everything urgent, including the dated shortfall that Before payday also flags on its row:
  // the count must equal the nav badge. Informational items live in the panel.
  const needs = (insights?.items ?? []).filter((i) => i.severity === 'CRITICAL' || i.severity === 'ATTENTION');

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
    // *within* the page rather than racing it (DESIGN_SYSTEM section 10).
    <div className="reveal-shell flex w-full flex-col gap-space-6">
      {welcome && (
        <p className="reveal max-w-[34rem] font-serif text-editorial text-ink">
          Welcome to Kosh. Here is what you can spend today.
        </p>
      )}

      {/* No "Today" title: the page opens on the answer, the way Month opens on its month name. The date
          is the figure's caption and the help icon sits on its row (TODAY_HERO_SPEC, 2026-11-11). */}
      <SpendToday
        state={financialState}
        isLoading={stateLoading}
        asOf={fulfilledTimeStamp}
        corner={<PageHelpButton topic="today.how-today-works" />}
      />

      {financialState && (
        <div className="reveal" style={{ '--reveal-delay': '200ms' } as CSSProperties}>
          <NeedsYou needs={needs} state={financialState} whatMoved={insights?.whatMoved} onOpen={showNeeds} />
        </div>
      )}

      <div className="reveal" style={{ '--reveal-delay': '260ms' } as CSSProperties}>
        <TodayEntries />
      </div>

      <section className="reveal" style={{ '--reveal-delay': '320ms' } as CSSProperties}>
        <SectionRule trailing={committed ? `${formatMoney(committed)} to leave` : undefined}>Before payday</SectionRule>
        <BeforePayday
          items={timeline}
          isLoading={timelineLoading}
          isError={timelineError}
          salaryDate={salaryDate}
          warnings={byRow}
        />
      </section>

      {financialState && (
        <div className="reveal" style={{ '--reveal-delay': '380ms' } as CSSProperties}>
          <StandingPanel state={financialState} />
        </div>
      )}
    </div>
  );
}
