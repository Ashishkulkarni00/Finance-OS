import { Row } from '@/components/Row';
import { Skeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { formatMoney } from '@/lib/money';
import { cycleProgressLabel } from '@/lib/dates';
import { useGetCyclesQuery, useGetCycleSnapshotQuery } from '@/services/cycleService';
import type { CycleResponse } from '@/types/cycle';

/** One query per closed cycle - see the identical pattern on ShortfallRow. */
function HistoryRow({ cycle }: { cycle: CycleResponse }) {
  const { data: snapshot } = useGetCycleSnapshotQuery(cycle.id);
  if (!snapshot) return null;

  return (
    <Row
      primary={cycleProgressLabel(cycle.startDate, cycle.endDate).split(' · ')[0]}
      secondary={`${formatMoney(snapshot.incomeTotal)} in · ${formatMoney(snapshot.expenseTotal)} out`}
      trailing={
        <span className="text-row text-ink">
          <Amount value={snapshot.net} role="row" emphasiseNegative /> saved
        </span>
      }
    />
  );
}

/** Cycle over cycle. SCREEN_SPECS S5 hierarchy #3. */
export function HistorySection() {
  const { data: page, isLoading } = useGetCyclesQuery();
  const closedCycles = (page?.content ?? []).filter((c) => c.closed);

  if (isLoading) {
    return (
      <section>
        <Skeleton className="h-16 w-full" />
      </section>
    );
  }

  if (closedCycles.length === 0) {
    return (
      <section>
        <SectionHeader>History</SectionHeader>
        <p className="text-caption text-ink-muted">
          No cycles closed yet. Close a month on Months once it ends, and it'll start building here.
        </p>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader trailing={`${closedCycles.length} closed`}>History</SectionHeader>
      <div className="flex flex-col">
        {closedCycles.map((cycle) => (
          <HistoryRow key={cycle.id} cycle={cycle} />
        ))}
      </div>
    </section>
  );
}
