import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { formatDayMonthYear } from '@/lib/dates';
import { formatMoney, formatPercent } from '@/lib/money';
import { useGetFinancialStateQuery } from '@/services/financialStateService';
import type { DebtTrajectoryResponse, ReviewMonth, ReviewSamePoint } from '@/types/review';
import { SERIES, StatTile } from './viz';

/**
 * Where you stand, as six tiles instead of a five-row statement (user, 2026-11-09: "no
 * information is feeling great to see"). The same figures as before - net worth, what's owed,
 * interest ahead, committed share, spending against the same day last month - each now a
 * number you can find at a glance, with its one line of context under it.
 *
 * <p>The committed share carries a meter: it is a ratio against a whole (income), which is
 * what a meter is for. Nothing is coloured as good or bad (rule 8) - the meter's fill is the
 * committed series colour, the same one it wears in every chart below.
 */
export function SummaryTiles({
  current,
  samePoint,
  debt,
}: {
  current?: ReviewMonth;
  samePoint?: ReviewSamePoint;
  debt?: DebtTrajectoryResponse;
}) {
  const { data: state, isLoading } = useGetFinancialStateQuery();

  if (isLoading || !state) {
    return (
      <div className="grid grid-cols-1 gap-space-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const debtFree = debt?.debtFreeDate ?? state.debt.debtFreeDate;
  const share = current?.committedShare;
  const change = samePoint ? Number(samePoint.spendChange) : null;

  return (
    <section aria-label="Where you stand" className="grid grid-cols-1 gap-space-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatTile
        label="Net worth"
        value={<Amount value={state.netWorth.netWorth} role="section" emphasiseNegative />}
        sub={`${formatMoney(state.netWorth.totalAssets)} owned · ${formatMoney(state.netWorth.totalLiabilities)} owed`}
      />
      <StatTile
        label="Still owed on loans"
        value={<Amount value={debt?.outstandingNow ?? state.debt.totalOutstanding} role="section" />}
        sub={debtFree ? `All clear by ${formatDayMonthYear(debtFree)}` : 'No clear-by date yet'}
      />
      <StatTile
        label="Interest still ahead"
        value={<Amount value={debt?.interestAhead} role="section" />}
        sub="Every rupee paid early comes off this"
      />
      <StatTile
        label="This month · in"
        value={<Amount value={current?.income} role="section" />}
        sub={current?.elapsedShare != null ? `${formatPercent(current.elapsedShare)} of the month gone` : undefined}
      />
      <StatTile
        label="Promised to commitments"
        value={<span className="num">{share != null ? formatPercent(share) : '—'}</span>}
        sub={share != null ? 'of this month’s income, before day-to-day' : 'Needs this month’s income recorded'}
      >
        {share != null && (
          <span
            className="mt-space-1 block h-[8px] w-full overflow-hidden rounded-full"
            style={{ background: 'color-mix(in srgb, var(--viz-1) 18%, var(--surface))' }}
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(1, share) * 100)}
            aria-label="Share of income promised to commitments"
          >
            <span className="block h-full rounded-full" style={{ width: `${Math.min(1, Math.max(0, share)) * 100}%`, background: SERIES.committed }} />
          </span>
        )}
      </StatTile>
      <StatTile
        label={samePoint ? `Spent vs day ${samePoint.daysIn} last month` : 'Spent this month'}
        value={
          samePoint ? (
            // Signed, never coloured: more going out in a month with a premium in it is not a failure.
            <Amount value={samePoint.spendChange} role="section" signed />
          ) : (
            <Amount value={current?.spend} role="section" />
          )
        }
        sub={
          samePoint
            ? `${change != null && change > 0 ? 'More' : change != null && change < 0 ? 'Less' : 'The same'} than by this day of ${samePoint.previousLabel}`
            : undefined
        }
      />
    </section>
  );
}
