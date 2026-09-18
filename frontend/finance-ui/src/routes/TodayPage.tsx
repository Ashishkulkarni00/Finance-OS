import { useState } from 'react';
import { CircleHelp, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetPositionQuery } from '@/services/positionService';
import { useGetCurrentCycleQuery } from '@/services/cycleService';
import { useGetCommitmentInstancesForCycleQuery } from '@/services/commitmentInstanceService';
import { useGetTimelineQuery } from '@/services/timelineService';
import { useGetAccountsQuery } from '@/services/accountService';
import { RoomLeftHero } from '@/features/today/components/RoomLeftHero';
import { PositionStatement } from '@/features/today/components/PositionStatement';
import { NeedsYouCard } from '@/features/today/components/NeedsYouCard';
import { ComingUpList } from '@/features/today/components/ComingUpList';
import { TodayPrimer } from '@/features/today/components/TodayPrimer';
import { GoalPaceCard } from '@/features/today/components/GoalPaceCard';
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
  const { data: position, isLoading: positionLoading } = useGetPositionQuery();
  const { data: cycle } = useGetCurrentCycleQuery();
  const {
    data: instances,
    isLoading: instancesLoading,
    isError: instancesError,
  } = useGetCommitmentInstancesForCycleQuery(cycle?.id ?? 0, { skip: !cycle });
  const { data: timeline, isLoading: timelineLoading, isError: timelineError } = useGetTimelineQuery({ days: 30 });

  const accounts = accountsPage?.content ?? [];
  const spendableAccountIds = accounts.filter((a) => a.countsAsSpendable && !a.archived).map((a) => a.id);
  // Same tier used on Month's Needs You zone - one definition, computed server-side,
  // so the two surfaces can't disagree. See AttentionTier.java.
  // Income is only flagged once it's late (AttentionTier) - then it belongs here too, phrased as income.
  const attentionInstances = (instances ?? []).filter((i) => i.attentionTier === 'NEEDS_YOU');

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
    <div className="flex flex-col gap-space-6">
      <div className="flex items-start justify-between gap-space-4">
        <div className="flex flex-col gap-space-1">
          <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Today</span>
          <span className="text-title text-ink">{formatFullDate()}</span>
          {cycle && <span className="num text-caption text-ink-muted">{cycleProgressLabel(cycle.startDate, cycle.endDate)}</span>}
        </div>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="flex shrink-0 items-center gap-space-1 rounded-md px-space-1 text-caption text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
        >
          <CircleHelp size={14} strokeWidth={1.5} aria-hidden />
          How Today works
        </button>
      </div>

      <TodayPrimer onOpenGuide={() => setGuideOpen(true)} />

      <div className="grid grid-cols-1 gap-space-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="flex flex-col gap-space-8">
          <RoomLeftHero position={position} cycle={cycle} isLoading={positionLoading} />
          <PositionStatement position={position} isLoading={positionLoading} />
        </div>

        <div className="flex flex-col gap-space-8">
          <NeedsYouCard
            attentionInstances={attentionInstances}
            // Skipped until the cycle resolves, which RTK Query reports as not-loading -
            // treat "no cycle yet" as still loading so Needs You can't declare itself empty.
            instancesLoading={instancesLoading || !cycle}
            instancesError={instancesError}
            spendableAccountIds={spendableAccountIds}
            accounts={accounts}
          />

          <GoalPaceCard />

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
