import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { Statement, StatementRow } from '@/components/Statement';
import type { LoanSummaryResponse } from '@/types/loan';

/**
 * Zone 1 - the position at a glance, as one panel: what leaves every month on the left,
 * the whole picture on the right. The same two-sided shape as the Months page's and Accounts'
 * overview panels, so the top of every screen is read the same way.
 *
 * <p>The two EMI totals are <strong>never added together</strong>, and the page never
 * shows a combined "monthly debt" number. A card-billed EMI "reaches you inside the card
 * bill, not separately" (the source workbook's own words) - adding it to the bank figure
 * would count the same money twice (rule 4).
 *
 * <p>"Still to pay" is the sum of every EMI still to come, not of outstanding principals:
 * it stays knowable even when a loan's interest terms were never supplied, which is why
 * it's the figure shown - labelled "at least" when some terms are missing.
 */
export function DebtStanding({ summary, isLoading }: { summary: LoanSummaryResponse | undefined; isLoading: boolean }) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-space-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex flex-col gap-space-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  // Presence checks, not arithmetic.
  const hasCardEmis = Number(summary.cardEmiTotal) > 0;

  return (
    <div className="grid grid-cols-1 gap-space-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-0">
      <div className="flex flex-col gap-space-2 lg:pr-space-8">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Leaving every month</span>
        <Amount value={summary.bankEmiTotal} role="hero" className="text-ink" />
        <p className="max-w-[40rem] text-body text-ink-soft">
          straight out of a bank account, across {summary.count} {summary.count === 1 ? 'loan' : 'loans'}.
        </p>
        {hasCardEmis && (
          <p className="max-w-[40rem] text-caption text-ink-muted">
            <Amount value={summary.cardEmiTotal} role="caption" className="text-ink-soft" /> more arrives inside a card
            bill — already part of paying that bill, so not added here.
          </p>
        )}
        {summary.tbdCount > 0 && (
          <p className="max-w-[40rem] text-caption text-attention">
            {summary.tbdCount} {summary.tbdCount === 1 ? 'loan has' : 'loans have'} no confirmed terms, so no payoff date
            is shown for {summary.tbdCount === 1 ? 'it' : 'them'} yet.
          </p>
        )}
      </div>

      <div className="border-t border-line pt-space-6 lg:border-l lg:border-t-0 lg:pl-space-8 lg:pt-0">
        <span className="mb-space-2 block text-micro uppercase tracking-[0.08em] text-ink-muted">All loans</span>
        <Statement>
          <StatementRow label="From a bank account" value={summary.bankEmiTotal} />
          {hasCardEmis && <StatementRow label="Inside a card bill" value={summary.cardEmiTotal} />}
          <StatementRow label="Still to pay" value={summary.remainingPaymentsTotal} variant="subtotal" />
        </Statement>
        <p className="mt-space-2 text-caption text-ink-muted">
          {summary.tbdCount > 0
            ? 'At least this much — every EMI still to come, whether or not the terms are known.'
            : 'Every EMI still to come, across every loan.'}
        </p>
      </div>
    </div>
  );
}
