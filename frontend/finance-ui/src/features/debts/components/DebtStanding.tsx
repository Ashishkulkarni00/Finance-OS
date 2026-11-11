import { Amount } from '@/components/Amount';
import { DetailHero } from '@/components/detail/DetailPage';
import { FactStrip, type Fact } from '@/components/FactStrip';
import { Skeleton } from '@/components/Skeleton';
import type { LoanSummaryResponse } from '@/types/loan';

/**
 * What the loans cost every month and what is left to repay (UI_UX_REVAMP_PLAN 4.7b): one hero and
 * one row of facts. The EMIs that arrive inside a card bill are shown as their own fact and never
 * added into the monthly figure - they are already part of paying that bill, so adding them would
 * count the same money twice (invariant 4).
 */
export function DebtStanding({ summary, isLoading }: { summary: LoanSummaryResponse | undefined; isLoading: boolean }) {
  if (isLoading || !summary) {
    return (
      <div className="flex flex-col gap-space-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const hasCardEmis = Number(summary.cardEmiTotal) > 0;
  const facts: Fact[] = [
    { label: 'Still to pay in all', value: <Amount value={summary.remainingPaymentsTotal} role="row" /> },
    ...(hasCardEmis ? [{ label: 'Inside a card bill', value: <Amount value={summary.cardEmiTotal} role="row" /> }] : []),
    { label: summary.count === 1 ? 'Loan' : 'Loans', value: summary.count },
  ];

  return (
    <section className="flex flex-col gap-space-5 max-md:gap-space-4">
      <DetailHero
        label="Leaving every month"
        sentence={`straight out of a bank account, across ${summary.count} ${summary.count === 1 ? 'loan' : 'loans'}.`}
      >
        <Amount value={summary.bankEmiTotal} role="hero" className="text-ink" />
      </DetailHero>

      <FactStrip facts={facts} className="border-y border-line" />

      <div className="flex max-w-[40rem] flex-col gap-space-1 text-caption text-ink-muted">
        {hasCardEmis && <p>Card EMIs arrive inside a card bill — already part of paying that bill, so not added to the monthly figure.</p>}
        <p>
          {summary.tbdCount > 0
            ? 'Still to pay is at least this much — every EMI still to come, whether or not the terms are known.'
            : 'Still to pay is every EMI still to come, across every loan.'}
        </p>
        {summary.tbdCount > 0 && (
          <p className="text-attention">
            {summary.tbdCount} {summary.tbdCount === 1 ? 'loan has' : 'loans have'} no confirmed terms, so no payoff date is shown for{' '}
            {summary.tbdCount === 1 ? 'it' : 'them'} yet.
          </p>
        )}
      </div>
    </section>
  );
}
