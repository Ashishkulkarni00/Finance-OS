import { ColumnChart, type ColumnDatum } from '@/components/charts/ColumnChart';
import { SectionHeader } from '@/components/SectionHeader';
import { cycleMonthName } from '@/lib/dates';
import { formatPercent } from '@/lib/money';
import type { ReviewMonth } from '@/types/review';
import { MonthFigureTable } from './MonthFigureTable';

interface WhereItWentProps {
  months: ReviewMonth[];
}

/**
 * The same months, broken into what the money was doing.
 *
 * <p>Committed and flexible are two steps of one grey because both are money going out;
 * invested is a different hue because it is money kept. The stack can break through the
 * income rule, and when it does that is the whole message - more left than arrived.
 *
 * <p><strong>The committed share is the point of this section.</strong> A month's flexible
 * spending is mostly weather; the share of income already promised before the month starts
 * is the structure, and it is the only number here that can be improved by a decision
 * rather than by restraint. At three-quarters of income there is no room for anything else
 * to matter, which is why it is the takeaway and the last column of the table.
 *
 * <p>No per-category breakdown and no budgets: that is a settled question (`CLAUDE.md`), and
 * flexible spending already has its own section against the user's own baseline on Months.
 */
export function WhereItWent({ months }: WhereItWentProps) {
  const data: ColumnDatum[] = months.map((month) => ({
    key: String(month.cycleId),
    label: cycleMonthName(month.endDate),
    recorded: month.recorded,
    current: month.current,
    // A month from before the plan was running has no split to draw - nothing in it was
    // linked to a bill because there were no bills. Drawn as one undivided band rather than
    // as a column that is 100% day-to-day, which would be a claim about the person.
    segments: month.planTracked
      ? [
          { key: 'committed', label: 'Committed', value: month.committed, tone: 'committed' as const },
          { key: 'flexible', label: 'Day to day', value: month.flexible, tone: 'flexible' as const },
          { key: 'invested', label: 'Invested', value: month.invested, tone: 'invest' as const },
        ]
      : [
          { key: 'spend', label: 'Out, plan not running yet', value: month.spend, tone: 'neutral' as const },
          { key: 'invested', label: 'Invested', value: month.invested, tone: 'invest' as const },
        ],
    reference: { value: month.income, label: 'In' },
  }));

  const untracked = months.filter((month) => month.recorded && !month.planTracked);

  const current = months.find((month) => month.current);
  // The most recent month that has ended - the only fair thing to read a share against,
  // since a share of a month still running is a share of a part month.
  const lastComplete = [...months].reverse().find((month) => month.recorded && !month.current);

  return (
    <section className="flex flex-col gap-space-6">
      <div>
        <SectionHeader trailing="committed · day to day · invested">Where it went</SectionHeader>
      </div>

      <ColumnChart
        data={data}
        takeaway={
          current?.committedShare != null ? (
            <>
              <span className="text-ink">{formatPercent(current.committedShare)}</span> of this month&rsquo;s income
              was already promised to commitments
              {lastComplete?.committedShare != null && <> — it was {formatPercent(lastComplete.committedShare)} in {cycleMonthName(lastComplete.endDate)}</>}.
              That share is the thing worth moving: day-to-day spending is what is left after it, not instead of it.
            </>
          ) : (
            <>
              Each column splits a month into what was promised, what was day-to-day, and what was invested. The
              rule is income — a stack above it is a month that spent money which did not arrive in it.
            </>
          )
        }
        description="A column per salary month, stacked into committed spending, day-to-day spending and money invested, with a rule marking income. Exact figures follow in the table below."
      />

      <MonthFigureTable
        months={months}
        columns={[
          { key: 'committed', head: 'Committed', money: (month) => month.committed },
          { key: 'flexible', head: 'Day to day', money: (month) => month.flexible },
          { key: 'invested', head: 'Invested', money: (month) => month.invested },
          { key: 'leftOver', head: 'Left liquid', money: (month) => month.leftOver },
          {
            key: 'share',
            head: 'Committed %',
            emphasis: true,
            node: (month) => <span className="num text-row text-ink">{formatPercent(month.committedShare)}</span>,
          },
        ]}
      />

      <p className="max-w-[72ch] text-caption text-ink-muted">
        <span className="text-ink-soft">Committed</span> is spending that settled a planned commitment — decided by
        the bill it was linked to, not by its category, so a fixed-looking expense that no commitment covers
        correctly counts as day-to-day.{' '}
        <span className="text-ink-soft">Left liquid</span> is what came in, less what went out, less what was moved
        into an investment.
        {untracked.length > 0 && (
          <>
            {' '}
            {untracked.map((month) => cycleMonthName(month.endDate)).join(' and ')}{' '}
            {untracked.length === 1 ? 'has' : 'have'} no split: no commitments were set up yet, so none of that
            spending could be linked to one. It is shown undivided rather than counted as entirely day-to-day.
          </>
        )}
      </p>
    </section>
  );
}
