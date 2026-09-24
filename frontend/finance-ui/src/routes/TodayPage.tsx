import { useState, type CSSProperties } from 'react';
import { CircleHelp, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetFinancialStateQuery } from '@/services/financialStateService';
import { useGetCurrentCycleQuery } from '@/services/cycleService';
import { useGetTimelineQuery } from '@/services/timelineService';
import { useGetAccountsQuery } from '@/services/accountService';
import { Pulse } from '@/features/today/components/Pulse';
import { InsightList } from '@/components/InsightList';
import { ComingUpList } from '@/features/today/components/ComingUpList';
import { TodayPrimer } from '@/features/today/components/TodayPrimer';
import { TodayGuideSheet } from '@/features/today/components/TodayGuideSheet';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { formatFullDate, cycleProgressLabel } from '@/lib/dates';

/**
 * Today - "can I spend, and is anything about to go wrong?" SCREEN_SPECS S1.
 *
 * <p>Brought in line with the Ledger: a page header that names the screen, a "How Today
 * works" guide one click away, and a dismissible primer that says the one-sentence
 * version on the page itself. The figures and their order are SCREEN_SPECS' hierarchy,
 * unchanged - the work here is making each of them explain itself.
 */
export default function TodayPage() {
  const [guideOpen, setGuideOpen] = useState(false);

  const { data: accountsPage, isLoading: accountsLoading } = useGetAccountsQuery();
  // One read for the whole Pulse. Today no longer fetches position separately: two reads of
  // the same money are two chances to show different figures on one screen.
  const { data: financialState, isLoading: stateLoading } = useGetFinancialStateQuery();
  const { data: cycle } = useGetCurrentCycleQuery();
  const { data: timeline, isLoading: timelineLoading, isError: timelineError } = useGetTimelineQuery({ days: 30 });

  const accounts = accountsPage?.content ?? [];

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

  return (
    // The shell settles first and slightly slower than its contents, so the figures arrive
    // *within* the page rather than racing it (DESIGN_SYSTEM §10).
    <div className="reveal-shell flex flex-col gap-space-6">
      <div className="flex items-start justify-between gap-space-4">
        <div className="flex flex-col gap-space-1">
          <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Today</span>
          <span className="text-title text-ink">{formatFullDate()}</span>
          {cycle && <span className="num text-caption text-ink-muted">{cycleProgressLabel(cycle.startDate, cycle.endDate)}</span>}
        </div>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="pressable flex shrink-0 items-center gap-space-1 rounded-md px-space-1 text-caption text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-ink"
        >
          <CircleHelp size={14} strokeWidth={1.5} aria-hidden />
          How Today works
        </button>
      </div>

      <TodayPrimer onOpenGuide={() => setGuideOpen(true)} />

      {/* Full width: the Pulse's notes column *is* the derivation, and squeezing it into
          half the page would turn "traceable" back into "take our word for it". */}
      <Pulse state={financialState} isLoading={stateLoading} />

      {/* Both land after the summary has finished, so the eye reaches "what needs me" only
          once "where do I stand" has settled. */}
      <div className="grid grid-cols-1 gap-space-8 lg:grid-cols-2">
        <div className="reveal flex flex-col gap-space-8" style={{ '--reveal-delay': '600ms' } as CSSProperties}>
          {/* One ranked list from the insight engine (≤3): shortfalls, what's due or late,
              card bills, a goal behind - replaces Needs you and the goal card. */}
          <InsightList surface="TODAY" />
        </div>

        <div className="reveal flex flex-col gap-space-8" style={{ '--reveal-delay': '660ms' } as CSSProperties}>
          <section>
            <SectionHeader trailing="next 30 days">Coming up</SectionHeader>
            <ComingUpList items={timeline} isLoading={timelineLoading} isError={timelineError} />
          </section>
        </div>
      </div>

      <TodayGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
