import { useState, type CSSProperties } from 'react';
import { CircleHelp, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetFinancialStateQuery } from '@/services/financialStateService';
import { useGetTimelineQuery } from '@/services/timelineService';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetInsightsQuery } from '@/services/insightService';
import { SpendToday } from '@/features/today/components/SpendToday';
import { BeforePayday, useDatedWarnings } from '@/features/today/components/BeforePayday';
import { StandingPanel } from '@/features/today/components/StandingPanel';
import { DayStatus } from '@/features/today/components/DayStatus';
import { InsightList } from '@/components/InsightList';
import { TodayPrimer } from '@/features/today/components/TodayPrimer';
import { TodayGuideSheet } from '@/features/today/components/TodayGuideSheet';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { formatMoney } from '@/lib/money';
import { formatFullDate, cycleProgressLabel, formatSalaryDate, shiftIsoDays } from '@/lib/dates';

/**
 * Today - "what can I spend today, and is anything about to go wrong?"
 *
 * <p><strong>Rebuilt 2026-11-01</strong> on the user's verdict: *"whatever is there on
 * today page I don't like it, how it's aligned and everything ... what numbers it's
 * showing how it came nothing is making sense ... how much I am able to spend for today
 * that should be there along with little relevant information."*
 *
 * <p>Four things were wrong and all four are structural, not cosmetic:
 *
 * <ol>
 *   <li><strong>The page answered a different question from its own title.</strong> The
 *       hero was Real Balance, a 27-day figure. The day's number was row one of a
 *       seven-row table in caption type. `SpendToday` makes the day's figure the hero and
 *       prints the arithmetic that produced it directly beneath.</li>
 *   <li><strong>Nothing aligned.</strong> The hero sat at the left margin while seven
 *       figures right-aligned ~850px away, so the eye zig-zagged down the page and half
 *       the screen was dead paper. Every block now holds a narrow measure (32-40rem) with
 *       figures in one column close enough to their labels to be read as rows.</li>
 *   <li><strong>Two figures both called "free", 3.5x apart, five rows apart.</strong>
 *       Free until salary ₹3,650 and Free this month ₹12,842 are both correct and measure
 *       different things, which is exactly why they could not sit unexplained next to one
 *       another. The second moved into `StandingPanel`, which says in words what it is.</li>
 *   <li><strong>The loudest number was the least actionable.</strong> Net worth, Owed and
 *       runway move over years and are not decisions anyone takes at 11am. Folded into
 *       Standing - one line, closed - rather than deleted, because "If income stopped"
 *       exists nowhere else in the product.</li>
 * </ol>
 *
 * <p><strong>One column, not two.</strong> The old 50/50 grid put three tall warning cards
 * beside three truncated timeline rows and left the bottom third of a 2400px page empty.
 * Reading order on this screen is genuinely linear - what can I spend, what is coming,
 * what needs me - and a single column is what lets each block keep its own measure.
 *
 * <p>Insights are fetched here rather than only inside `InsightList` so a dated shortfall
 * can be attached to the payment row it breaks and then suppressed as a card. RTK Query
 * dedupes the two subscriptions into one request.
 */
export default function TodayPage() {
  const [guideOpen, setGuideOpen] = useState(false);

  const { data: accountsPage, isLoading: accountsLoading } = useGetAccountsQuery();
  // One read for the whole page's money. Today does not fetch position separately: two
  // reads of the same money are two chances to show different figures on one screen.
  const { data: financialState, isLoading: stateLoading } = useGetFinancialStateQuery();
  const { data: timeline, isLoading: timelineLoading, isError: timelineError } = useGetTimelineQuery({ days: 45 });
  const { data: insights } = useGetInsightsQuery('TODAY');

  const accounts = accountsPage?.content ?? [];
  const cycle = financialState?.cycle;
  // Payday is the day after the cycle's last - the salary that starts the next one.
  const salaryDate = cycle ? shiftIsoDays(cycle.endDate, 1) : null;
  const { byRow, consumed } = useDatedWarnings(timeline, insights?.items);

  // The highest-ranked warning that is not already shown on a payment row. It is promoted
  // into the slot under the day's figure and removed from the rail by key - the same
  // say-it-once rule the dated shortfalls follow. The server has already ranked these, so
  // "top" is its ordering, not a judgement made here.
  const promoted = insights?.items.find((i) => !consumed.includes(i.key));
  const railHidden = promoted ? [...consumed, promoted.key] : consumed;

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
    <div className="reveal-shell flex flex-col gap-space-8">
      <div className="flex items-start justify-between gap-space-4">
        <div className="flex flex-col gap-space-1">
          <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Today</span>
          <span className="text-title text-ink">{formatFullDate()}</span>
          {cycle && (
            <span className="num text-caption text-ink-muted">{cycleProgressLabel(cycle.startDate, cycle.endDate)}</span>
          )}
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

      <div className="border-b border-line pb-space-8">
        <SpendToday
          state={financialState}
          isLoading={stateLoading}
          status={
            financialState && (
              <DayStatus item={promoted} state={financialState} whatMoved={insights?.whatMoved} />
            )
          }
        />
      </div>

      {/* The detail, in two columns under the summary band.
          Not 50/50: `Before payday` carries four facts per row - name, kind, account,
          amount - and is the longer list by far, so it takes the 1fr track; the warnings
          are self-contained cards that read perfectly well in a rail. The divider is
          `MonthOverview`'s, which is this app's way of splitting a block without a gutter
          wide enough to read as two unrelated pages.
          Both land after the summary has settled, so the eye reaches "what is coming" only
          once "what can I spend" has been read. */}
      <div className="grid grid-cols-1 gap-space-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:gap-0">
        <section className="reveal xl:pr-space-8" style={{ '--reveal-delay': '420ms' } as CSSProperties}>
          <SectionHeader
            trailing={
              committed && cycle
                ? `${formatMoney(committed)} still to leave · salary ${formatSalaryDate(cycle.endDate)}`
                : undefined
            }
          >
            Before payday
          </SectionHeader>
          <BeforePayday
            items={timeline}
            isLoading={timelineLoading}
            isError={timelineError}
            salaryDate={salaryDate}
            warnings={byRow}
          />
        </section>

        {/* The rail: everything on this screen that is not the payment timeline.
            Whatever warnings are left - the dated ones went to their own rows, the
            highest-ranked one went beside the day's figure - then the long-horizon figures,
            folded away. Retitled from "Needs you": by the time the list gets here the thing
            that most needs you is already on screen twice over, and a header claiming
            urgency over a goal note is the sort of small lie that teaches people to stop
            reading headers. Standing sits here rather than full-width at the foot because
            the rail would otherwise run empty for most of its height beside a fourteen-row
            list, and the two belong together as "the rest of the picture" against the left
            column's "what happens next". */}
        <div
          className="reveal flex flex-col gap-space-8 border-t border-line pt-space-8 xl:border-l xl:border-t-0 xl:pl-space-8 xl:pt-0"
          style={{ '--reveal-delay': '500ms' } as CSSProperties}
        >
          <InsightList surface="TODAY" title="Also worth a look" hideKeys={railHidden} hideWhenEmpty />
          {financialState && <StandingPanel state={financialState} />}
        </div>
      </div>

      <TodayGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
