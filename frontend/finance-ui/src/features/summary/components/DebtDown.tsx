import { TrendingDown } from 'lucide-react';
import { DebtCurve } from './DebtCurve';
import { EmptyState } from '@/components/EmptyState';
import { Disclosure } from '@/components/Disclosure';
import { SectionHeader } from '@/components/SectionHeader';
import { PayoffTimeline } from './PayoffTimeline';
import { formatDayMonthYear } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { DebtTrajectoryResponse } from '@/types/review';

interface DebtDownProps {
  debt: DebtTrajectoryResponse;
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
        <SectionHeader>Is debt going down?</SectionHeader>
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

  const years = debt.monthsToDebtFree != null ? Math.floor(debt.monthsToDebtFree / 12) : null;
  const restMonths = debt.monthsToDebtFree != null ? debt.monthsToDebtFree % 12 : null;

  return (
    <section className="m-card flex flex-col gap-space-6 max-md:gap-space-4">
      <div>
        <SectionHeader overCard trailing={`${debt.loans.length === 1 ? '1 loan' : `${debt.loans.length} loans`}`}>
          Is debt going down?
        </SectionHeader>
      </div>

      <p className="max-w-[72ch] text-body text-ink-soft">
        {debt.debtFreeDate ? (
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
          )}
      </p>

      <DebtCurve debt={debt} />

      <Disclosure storageKey="kosh.summary.payoff" label="When each loan ends" summary="a bar per loan, to its last EMI">
        <PayoffTimeline debt={debt} />
      </Disclosure>

      {debt.unrecordedEmis > 0 && (
        <p className="max-w-[72ch] text-caption text-attention">
          {debt.unrecordedEmis === 1 ? 'One EMI has' : `${debt.unrecordedEmis} EMIs have`} already fallen due with no
          payment recorded against {debt.unrecordedEmis === 1 ? 'it' : 'them'}. The curve walks past{' '}
          {debt.unrecordedEmis === 1 ? 'it' : 'them'} anyway — settling the bill on Months is what moves the balance.
        </p>
      )}

    </section>
  );
}
