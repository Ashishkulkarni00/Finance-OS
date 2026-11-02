import { ColumnChart, type ColumnDatum } from '@/components/charts/ColumnChart';
import { SectionHeader } from '@/components/SectionHeader';
import { cycleMonthName } from '@/lib/dates';
import { formatMoney, formatPercent } from '@/lib/money';
import type { ReviewMonth, ReviewSamePoint } from '@/types/review';
import { MonthFigureTable } from './MonthFigureTable';

interface MonthByMonthProps {
  months: ReviewMonth[];
  monthsRecorded: number;
  samePoint?: ReviewSamePoint;
}

/**
 * Income against spending, one salary month at a time.
 *
 * <p>Spending is the column; income is a rule across it. Two sets of bars side by side was
 * the obvious form and the worse one: the question is not "how big were these two numbers"
 * but "did spending fit inside what came in", and a ceiling the column either clears or
 * does not answers that in one glance. Where the column breaks through the rule, the month
 * ran on money that did not arrive in it.
 *
 * <p>The current month's column is short because the month is short, not because spending
 * is down - which is why the honest comparison is the one in the takeaway, cut to the same
 * day of the previous month, and why the table says "still running".
 */
export function MonthByMonth({ months, monthsRecorded, samePoint }: MonthByMonthProps) {
  const data: ColumnDatum[] = months.map((month) => ({
    key: String(month.cycleId),
    label: cycleMonthName(month.endDate),
    recorded: month.recorded,
    current: month.current,
    segments: [{ key: 'spend', label: 'Out', value: month.spend, tone: 'committed' as const }],
    reference: { value: month.income, label: 'In' },
  }));

  const current = months.find((month) => month.current);

  return (
    <section className="flex flex-col gap-space-6">
      <div>
        <SectionHeader trailing={monthsRecorded === 1 ? '1 month recorded' : `${monthsRecorded} months recorded`}>
          Month by month
        </SectionHeader>
      </div>

      <ColumnChart
        data={data}
        takeaway={
          samePoint ? (
            <>
              {Number(samePoint.spendChange) === 0 ? (
                <>Spending is level with the same day of {samePoint.previousLabel}.</>
              ) : (
                <>
                  <span className="text-ink">{formatMoney(samePoint.spendChange)}</span>{' '}
                  {Number(samePoint.spendChange) > 0 ? 'more' : 'less'} has gone out than by day {samePoint.daysIn} of{' '}
                  {samePoint.previousLabel}
                  {current?.elapsedShare != null && <> — this month is {formatPercent(current.elapsedShare)} through</>}.
                </>
              )}{' '}
              The rule across each column is what came in that month.
            </>
          ) : (
            <>
              What went out each salary month, against what came in — the rule across each column.
              {monthsRecorded < 2 && ' One month is a starting point, not a trend; this fills in as months pass.'}
            </>
          )
        }
        description="A column per salary month showing total spending, with a horizontal rule marking the income recorded in that month. Exact figures follow in the table below."
      />

      <MonthFigureTable
        months={months}
        columns={[
          { key: 'income', head: 'In', money: (month) => month.income },
          { key: 'spend', head: 'Out', money: (month) => month.spend },
          { key: 'invested', head: 'Invested', money: (month) => month.invested },
          { key: 'net', head: 'Kept', money: (month) => month.net, emphasis: true },
          {
            key: 'rate',
            head: 'Kept %',
            node: (month) => (
              <span className="num text-row text-ink-soft">{formatPercent(month.savingsRate)}</span>
            ),
          },
        ]}
      />

      <p className="max-w-[72ch] text-caption text-ink-muted">
        <span className="text-ink-soft">Kept</span> is what came in less what went out. Money moved into an
        investment is not spending, so it is not subtracted here — it appears under Invested, and under{' '}
        <span className="text-ink-soft">Left liquid</span> in the next section.{' '}
        <span className="text-ink-soft">—</span> means nothing was recorded in that month, which is not the same
        as nothing happening.
      </p>
    </section>
  );
}
