import { Momentum } from '@/features/summary/components/Momentum';
import { Disclosure } from '@/components/Disclosure';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { PageSubtitle } from '@/features/help/PageHelp';
import { DebtDown } from '@/features/summary/components/DebtDown';
import { MonthByMonth } from '@/features/summary/components/MonthByMonth';
import { PlanKept } from '@/features/summary/components/PlanKept';
import { WhereItWent } from '@/features/summary/components/WhereItWent';
import { CategoryHeatmap } from '@/features/summary/components/CategoryHeatmap';
import { useGetDebtTrajectoryQuery, useGetReviewMonthsQuery } from '@/services/reviewService';

const HORIZON = 12;

/**
 * Summary - "is anything changing?" (UI_UX_REVAMP_PLAN 4.10). Every other screen reports where you stand
 * today; this one puts the salary months beside each other.
 *
 * <p>Four questions, one chart each, each with its takeaway sentence above it: am I keeping more than I
 * spend, where does the money go, is debt going down, did the plan hold. The strip of "which way
 * things are moving" comes first because it is the whole page in words. The six-tile KPI grid that used
 * to open the page is gone (DESIGN_SYSTEM 14 forbids an equal-weight grid of numbers); every figure
 * it carried is in the sentence of the section it belongs to. Detail - the category heatmap, each
 * loan's end date, every table - is closed until asked for.
 *
 * <p>There is no manual topic for this page yet, so there is no help icon: a `?` that opens "still
 * being written" would be worse than none.
 */
export default function SummaryPage() {
  const months = useGetReviewMonthsQuery(HORIZON);
  const debt = useGetDebtTrajectoryQuery();

  if (months.isLoading) {
    return (
      <div className="flex flex-col gap-space-6">
        <Skeleton className="h-7 w-40" />
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

  return (
    <div className="reveal-shell flex w-full flex-col gap-10">
      <header className="flex flex-col gap-space-1">
        <h1 className="text-page text-ink">Summary</h1>
        <PageSubtitle>Your salary months side by side - is anything changing?</PageSubtitle>
        {data.monthsRecorded < 3 && (
          <p className="max-w-[64ch] text-caption text-ink-muted">
            {data.monthsRecorded === 1 ? 'Only one full month has' : `Only ${data.monthsRecorded} full months have`} been recorded so
            far, so the shapes below are a beginning rather than a trend. Debt does not depend on history and is complete today.
          </p>
        )}
      </header>

      <Momentum />

      <MonthByMonth months={data.months} monthsRecorded={data.monthsRecorded} samePoint={data.samePoint} />

      <WhereItWent months={data.months} />

      {debt.isError ? (
        <ErrorState message="We couldn’t load the debt curve." onRetry={() => debt.refetch()} />
      ) : debt.data ? (
        <DebtDown debt={debt.data} />
      ) : (
        <Skeleton className="h-[16rem] w-full" />
      )}

      <PlanKept months={data.months} />

      <div className="flex flex-col">
        <Disclosure storageKey="kosh.summary.heatmap" label="How each category moved" summary="category by month, darker is more">
          <CategoryHeatmap months={data.months} />
        </Disclosure>
      </div>
    </div>
  );
}
