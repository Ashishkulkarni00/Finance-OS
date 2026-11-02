import { Amount } from '@/components/Amount';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { Statement, StatementRow } from '@/components/Statement';
import { formatDayMonthYear } from '@/lib/dates';
import { formatMoney, formatPercent } from '@/lib/money';
import { useGetFinancialStateQuery } from '@/services/financialStateService';
import type { DebtTrajectoryResponse, ReviewMonth, ReviewSamePoint } from '@/types/review';

interface WhereYouStandProps {
  /** The month in progress, for the one figure here that is about this month. */
  current?: ReviewMonth;
  samePoint?: ReviewSamePoint;
  debt?: DebtTrajectoryResponse;
}

/**
 * Four figures and no chart.
 *
 * <p>DESIGN_SYSTEM §8 opens with "default to a number", and these four are exactly the case
 * it means: each one is a single present value, so its shape over time is not the insight -
 * the charts below handle that. A row of tiles was tried on Today and read as less careful
 * than the spreadsheet; the statement form is what replaced it, and the same reasoning holds
 * here (see `Pulse.tsx`).
 *
 * <p>The four are chosen for *growth*, not activity. Net worth and what is still owed are
 * the position; interest ahead is what carrying it costs, which is the number that makes an
 * extra payment mean something; and the committed share is the structural one - at 76% of
 * income there is no room for any of the others to improve, whatever a month's spending does.
 */
export function WhereYouStand({ current, samePoint, debt }: WhereYouStandProps) {
  const { data: state, isLoading } = useGetFinancialStateQuery();

  if (isLoading || !state) {
    return (
      <section>
        <SectionHeader>Where you stand</SectionHeader>
        <div className="flex flex-col gap-space-3 pt-space-2">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-space-6 w-full" />
          ))}
        </div>
      </section>
    );
  }

  const debtFree = debt?.debtFreeDate ?? state.debt.debtFreeDate;

  return (
    <section>
      <SectionHeader trailing={`as at ${formatDayMonthYear(state.asOf)}`}>Where you stand</SectionHeader>

      <Statement notes>
        <StatementRow
          label="Net worth"
          value={state.netWorth.netWorth}
          variant="subtotal"
          note={`Everything you hold, ${formatMoney(state.netWorth.totalAssets)}, less everything you owe, ${formatMoney(state.netWorth.totalLiabilities)}.`}
        />

        <StatementRow
          label="Still owed on loans"
          value={debt?.outstandingNow ?? state.debt.totalOutstanding}
          note={
            debtFree
              ? `Clear on ${formatDayMonthYear(debtFree)}, if the EMIs are paid as they fall.`
              : state.debt.loansWithoutTerms > 0
                ? `No clear date: ${state.debt.loansWithoutTerms === 1 ? 'one loan has' : `${state.debt.loansWithoutTerms} loans have`} no rate recorded, and a date that leaves a loan out would be wrong.`
                : 'No clear date yet.'
          }
        />

        <StatementRow
          label="Interest still ahead"
          value={debt?.interestAhead}
          note="What the remaining EMIs cost on top of the principal. Every rupee paid early comes off this."
        />

        <StatementRow
          label="Committed share of income"
          valueNode={
            <span className="num text-row text-ink">
              {current?.committedShare != null ? formatPercent(current.committedShare) : '—'}
            </span>
          }
          note={
            current?.committedShare != null
              ? 'Of what came in this month, this much was already spoken for. The figure that decides whether anything else can improve.'
              : 'Needs income recorded this month before it means anything.'
          }
        />

        {samePoint && (
          <StatementRow
            label={`Spending, against day ${samePoint.daysIn} last month`}
            variant="subtotal"
            // Signed, because the sign is the whole figure: "₹17,631" is an amount and
            // "+₹17,631" is a change. Deliberately not coloured - more going out in a
            // month with the insurance premium in it is not a failure (rule 8).
            valueNode={<Amount value={samePoint.spendChange} role="section" signed />}
            note={`${formatMoney(samePoint.previousSpend)} had gone out by the same day of ${samePoint.previousLabel}. Compared at the same point in the month, not against its full total.`}
          />
        )}
      </Statement>
    </section>
  );
}
