import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '@/components/SectionHeader';
import { InvestmentRow } from '@/features/investments/components/InvestmentRow';
import { formatMoney } from '@/lib/money';
import { useGetInvestmentsQuery, useGetInvestmentSummaryQuery } from '@/services/investmentService';

/**
 * Zone 6 - what's held.
 *
 * <p>This used to list INVESTMENT-type accounts and admit, in a footnote, that gain
 * tracking wasn't built (ACCOUNTS_EXPERIENCE.md §8 deliberately refused to fake it from
 * a single balance figure). It is now, so the register shows real holdings with real
 * valuations - including the ones with no ledger account at all, which an account-driven
 * list could never show.
 *
 * <p>Rows come from `InvestmentRow`, the same component the Investments tab uses, so the
 * two can't drift into telling different stories about the same holding.
 */
export function InvestmentsRegister() {
  const navigate = useNavigate();
  const { data: page } = useGetInvestmentsQuery();
  const { data: summary } = useGetInvestmentSummaryQuery();

  const investments = page?.content ?? [];
  if (investments.length === 0) return null;

  return (
    <section>
      <SectionHeader trailing={summary ? `${formatMoney(summary.totalInvested)} put in` : undefined}>
        Investments · {investments.length}
      </SectionHeader>
      {summary && Number(summary.outsideLedgerTotal) > 0 && (
        // The same fact the net worth panel states, said here too - the register is where
        // someone looking at an ₹85,000 NPS will wonder why net worth ignores it.
        <p className="mb-space-3 text-caption text-ink-muted">
          {formatMoney(summary.outsideLedgerTotal)} of this is held outside your accounts, so it isn’t in net worth.
        </p>
      )}
      <div className="flex flex-col">
        {investments.map((investment) => (
          <InvestmentRow key={investment.id} investment={investment} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => navigate('/investments')}
        className="mt-space-3 text-label text-accent hover:underline"
      >
        Manage investments
      </button>
    </section>
  );
}
