import { Momentum } from '@/features/summary/components/Momentum';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { DebtDown } from '@/features/summary/components/DebtDown';
import { MonthByMonth } from '@/features/summary/components/MonthByMonth';
import { PlanKept } from '@/features/summary/components/PlanKept';
import { WhereItWent } from '@/features/summary/components/WhereItWent';
import { SummaryTiles } from '@/features/summary/components/SummaryTiles';
import { CategoryHeatmap } from '@/features/summary/components/CategoryHeatmap';
import { useGetDebtTrajectoryQuery, useGetReviewMonthsQuery } from '@/services/reviewService';

const HORIZON = 12;

/**
 * Summary - the salary months consolidated, served at `/summary`.
 *
 * <p>The sixth place in the rail. The five-destination IA (STRATEGY_DEEP_DIVE §D, decision
 * S2) was "one per thing people come to do", and this is a sixth such thing rather than a
 * sixth entity: every other screen answers *where do I stand now* or *what do I do next*,
 * and none of them answers *am I getting anywhere*. That question needs the months beside
 * each other, which no single-month screen can show without becoming two screens.
 *
 * <p><strong>Ordered by what it is for, which is growth, not chronology.</strong> Where you
 * stand is the position; month by month and where it went are whether it is moving; debt
 * down is the only one of the five that is mostly about the future, and it is deliberately
 * not last - it is the section with real data today, and the one a person actually wants to
 * look at. Did the plan hold closes, because it is about conduct rather than amounts.
 *
 * <p>Nothing here is a new source of truth. Every figure comes from `/review/months` or
 * `/review/debt-trajectory`, both of which recompute from the same engines the other
 * screens read, so a number on this page cannot disagree with the page it came from.
 */
export default function SummaryPage() {
  const months = useGetReviewMonthsQuery(HORIZON);
  const debt = useGetDebtTrajectoryQuery();

  if (months.isLoading) {
    return (
      <div className="flex flex-col gap-space-8">
        <Skeleton className="h-space-10 w-[22rem]" />
        <Skeleton className="h-[12rem] w-full" />
        <Skeleton className="h-[14rem] w-full" />
      </div>
    );
  }

  if (months.isError || !months.data) {
    return (
      <ErrorState
        message="We couldn’t load the months. Nothing is wrong with your data — this screen only reads."
        onRetry={() => months.refetch()}
      />
    );
  }

  const data = months.data;
  const current = data.months.find((month) => month.current);

  return (
    <div className="flex flex-col gap-space-10">
      <header className="flex flex-col gap-space-2">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Summary</span>
        <h1 className="max-w-[40ch] font-serif text-editorial text-ink">
          Where the money is going, month after month.
        </h1>
        <p className="max-w-[64ch] text-body text-ink-soft">
          Every other screen answers where you stand today. This one puts the salary months beside each other, so
          the question it answers is whether anything is changing.
          {data.monthsRecorded < 3 && (
            <>
              {' '}
              {data.monthsRecorded === 1 ? 'One month has' : `${data.monthsRecorded} months have`} been recorded so
              far, so the shapes below are a beginning rather than a trend. Debt down does not depend on history and
              is complete today.
            </>
          )}
        </p>
      </header>

      <SummaryTiles current={current} samePoint={data.samePoint} debt={debt.data} />

      <Momentum />

      <MonthByMonth months={data.months} monthsRecorded={data.monthsRecorded} samePoint={data.samePoint} />

      <WhereItWent months={data.months} />

      <CategoryHeatmap months={data.months} />

      {debt.isError ? (
        <ErrorState message="We couldn’t load the debt curve." onRetry={() => debt.refetch()} />
      ) : debt.data ? (
        <DebtDown debt={debt.data} />
      ) : (
        <Skeleton className="h-[16rem] w-full" />
      )}

      <PlanKept months={data.months} />
    </div>
  );
}
