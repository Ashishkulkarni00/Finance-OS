import { TrendingDown } from 'lucide-react';
import { TrendLine, type TrendMarker, type TrendPoint } from '@/components/charts/TrendLine';
import { Amount } from '@/components/Amount';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { Statement, StatementRow } from '@/components/Statement';
import { formatDayMonthYear } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { DebtTrajectoryResponse } from '@/types/review';

interface DebtDownProps {
  debt: DebtTrajectoryResponse;
}

/** "Oct 26" - short enough that a 37-month axis can carry one every six months. */
function monthLabel(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-IN', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}

/**
 * Every loan walked forward to the day the last one clears.
 *
 * <p>The one chart here that is full of data on day one: it is derived from each loan's own
 * amortisation rather than from months of history, so it works on the first day the product
 * is used. It is also the closest thing on any screen to what this product claims to be for
 * - carrying a commitment through time instead of interpreting the past.
 *
 * <p>A line rather than columns, because a balance is genuinely continuous between EMIs
 * (DESIGN_SYSTEM §8). Clay, never red: debt is being worked down, not an emergency, and
 * colouring it as danger every month is the shame loop this product refuses (§7).
 *
 * <p>Honest about three things, each in words rather than implied: the curve assumes the
 * EMIs get paid, a loan with no rate cannot be walked forward at all and is named, and
 * there is no debt-free date at all while any loan is missing from the curve.
 */
export function DebtDown({ debt }: DebtDownProps) {
  if (debt.points.length < 2) {
    return (
      <section>
        <SectionHeader>Debt down</SectionHeader>
        <EmptyState
          icon={TrendingDown}
          headline={debt.loans.length === 0 ? 'Nothing owed' : 'Not enough to draw the curve'}
          body={
            debt.loans.length === 0
              ? 'Nothing is owed, so there is nothing to walk forward.'
              : 'A loan needs its interest rate recorded before its balance can be projected month by month. Add the rate on the loan and this fills in.'
          }
        />
      </section>
    );
  }

  const points: TrendPoint[] = debt.points.map((point) => ({
    label: monthLabel(point.month),
    value: point.outstanding,
  }));

  // Each loan's payoff placed on the curve by month, so the line is annotated where it
  // actually steps down rather than in a legend beside it.
  const indexOfMonth = new Map(debt.points.map((point, index) => [point.month.slice(0, 7), index]));
  const markers: TrendMarker[] = debt.loans
    .filter((loan) => loan.inCurve && loan.payoffDate)
    .map((loan) => ({
      key: String(loan.loanId),
      index: indexOfMonth.get(loan.payoffDate!.slice(0, 7)) ?? -1,
      label: `${loan.name} clears ${formatDayMonthYear(loan.payoffDate!)}`,
    }))
    .filter((marker) => marker.index > 0)
    .sort((a, b) => a.index - b.index);

  const years = debt.monthsToDebtFree != null ? Math.floor(debt.monthsToDebtFree / 12) : null;
  const restMonths = debt.monthsToDebtFree != null ? debt.monthsToDebtFree % 12 : null;

  return (
    <section className="flex flex-col gap-space-6">
      <div>
        <SectionHeader trailing={`${debt.loans.length === 1 ? '1 loan' : `${debt.loans.length} loans`}`}>
          Debt down
        </SectionHeader>
      </div>

      <TrendLine
        points={points}
        markers={markers}
        takeaway={
          debt.debtFreeDate ? (
            <>
              <span className="text-ink">{formatMoney(debt.outstandingNow)}</span> is owed today. Paying the EMIs as
              they fall clears every loan by{' '}
              <span className="text-ink">{formatDayMonthYear(debt.debtFreeDate)}</span>
              {years != null && years > 0 && (
                <>
                  {' '}— {years} {years === 1 ? 'year' : 'years'}
                  {restMonths ? ` and ${restMonths} ${restMonths === 1 ? 'month' : 'months'}` : ''} from now
                </>
              )}
              , and costs <span className="text-ink">{formatMoney(debt.interestAhead)}</span> in interest on the way.
            </>
          ) : (
            <>
              <span className="text-ink">{formatMoney(debt.outstandingNow)}</span> is owed on the loans that can be
              projected. There is no clear-by date, because{' '}
              {debt.excludedLoanCount === 1 ? 'one loan is' : `${debt.excludedLoanCount} loans are`} missing a rate —
              a date that left one out would be the most encouraging possible lie.
            </>
          )
        }
        description="A falling line showing the total still owed across every loan, one point per month, from today to the month the last loan clears. Each loan's payoff is marked and listed below."
      />

      <Statement notes>
        <StatementRow label="Owed today" value={debt.outstandingNow} variant="subtotal" note="Across every loan in the curve, from the payments recorded against each one." />
        <StatementRow
          label="Interest still ahead"
          value={debt.interestAhead}
          note="On top of the principal, if every EMI is paid as scheduled. Paying ahead reduces this; paying late increases it."
        />
        <StatementRow
          label="Clear by"
          valueNode={
            <span className="num text-row text-ink">
              {debt.debtFreeDate ? formatDayMonthYear(debt.debtFreeDate) : '—'}
            </span>
          }
          note={
            debt.debtFreeDate
              ? 'The last loan’s final EMI.'
              : 'Withheld on purpose while a loan is missing from the curve.'
          }
        />
        {debt.excludedLoanCount > 0 && (
          <StatementRow
            label={`Not in this curve (${debt.excludedLoanCount})`}
            value={debt.excludedOutstanding}
            note="No interest rate recorded, so the balance cannot be walked forward. The real total owed is higher than the line shows."
          />
        )}
      </Statement>

      {debt.unrecordedEmis > 0 && (
        <p className="max-w-[72ch] text-caption text-attention">
          {debt.unrecordedEmis === 1 ? 'One EMI has' : `${debt.unrecordedEmis} EMIs have`} already fallen due with no
          payment recorded against {debt.unrecordedEmis === 1 ? 'it' : 'them'}. The curve walks past{' '}
          {debt.unrecordedEmis === 1 ? 'it' : 'them'} anyway — settling the bill on Months is what moves the balance.
        </p>
      )}

      <div className="flex flex-col">
        {debt.loans.map((loan) => (
          <div
            key={loan.loanId}
            className="flex items-baseline justify-between gap-space-4 border-b border-line py-space-3 last:border-b-0"
          >
            <span className="min-w-0">
              <span className="block truncate text-label text-ink">{loan.name}</span>
              <span className="block text-caption text-ink-muted">
                {loan.inCurve && loan.payoffDate
                  ? `${formatMoney(loan.emi)} a month, clears ${formatDayMonthYear(loan.payoffDate)}`
                  : 'No rate recorded — not in the curve'}
              </span>
            </span>
            <Amount value={loan.outstanding} role="row" className="shrink-0 text-ink-soft" />
          </div>
        ))}
      </div>
    </section>
  );
}
