import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { LoanRow } from '@/features/debts/components/LoanRow';
import { formatMoney } from '@/lib/money';
import { useGetLoansQuery, useGetLoanSummaryQuery } from '@/services/loanService';

/**
 * Accounts' debt register - the payoff countdown, never a bare outstanding balance
 * (SCREEN_SPECS S4 hierarchy #4).
 *
 * <p>Rows come from `LoanRow`, the same component the Debts tab uses, so the two can't
 * drift into telling different stories about the same loan. Everything beyond the list -
 * the confidence triage, the bank-versus-card split, the remaining-payments total -
 * lives on the Debts tab; this is the register, not a second copy of that page.
 *
 * <p>The header shows only what leaves a <em>bank</em> account. A card-billed EMI arrives
 * inside the card bill, which this page already accounts for under Cards - adding it here
 * too would count the same money twice (rule 4).
 */
export function DebtsSection() {
  const navigate = useNavigate();
  const { data: loansPage, isLoading } = useGetLoansQuery();
  const { data: summary } = useGetLoanSummaryQuery();
  const loans = (loansPage?.content ?? []).filter((l) => l.status !== 'CLOSED');

  if (isLoading) {
    return (
      <section>
        <Skeleton className="h-24 w-full" />
      </section>
    );
  }
  if (loans.length === 0) return null;

  return (
    <section>
      <SectionHeader trailing={summary ? `${formatMoney(summary.bankEmiTotal)}/mo from a bank account` : undefined}>
        Debts · {loans.length}
      </SectionHeader>
      <div className="flex flex-col">
        {loans.map((loan) => (
          <LoanRow key={loan.id} loan={loan} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => navigate('/debts')}
        className="mt-space-3 text-label text-accent hover:underline"
      >
        Manage debts
      </button>
    </section>
  );
}
