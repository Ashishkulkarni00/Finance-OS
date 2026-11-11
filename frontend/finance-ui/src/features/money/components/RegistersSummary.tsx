import { Amount } from '@/components/Amount';
import { LedgerRow } from '@/components/LedgerRow';
import { SectionHeader } from '@/components/SectionHeader';
import { useGetCreditCardsQuery } from '@/services/cardService';
import { useGetInsuranceSummaryQuery } from '@/services/insuranceService';
import { useGetInvestmentSummaryQuery } from '@/services/investmentService';
import { useGetLoanSummaryQuery } from '@/services/loanService';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The other four registers, one ruled row each (UI_UX_REVAMP_PLAN 4.7). Money's Overview is a
 * summary: cash and bank keep their full list because that is the daily register, but cards,
 * debts, investments and insurance each collapse to a total, a count and one status, linking to
 * their own tab for the detail. A register with nothing in it is simply absent.
 *
 * <p>Every figure is the server's summary for that register. Nothing is added across registers
 * here: they measure different things (what is owed, what is put in, what is covered).
 */
export function RegistersSummary() {
  const { data: cards } = useGetCreditCardsQuery();
  const { data: loans } = useGetLoanSummaryQuery();
  const { data: investments } = useGetInvestmentSummaryQuery();
  const { data: cover } = useGetInsuranceSummaryQuery();

  const rows = [
    cards && cards.cards.length > 0 && (
      <LedgerRow
        key="cards"
        to="/money/cards"
        primary="Credit cards"
        secondary={
          cards.billsDueCount > 0
            ? `${plural(cards.cards.length, 'card', 'cards')} · ${plural(cards.billsDueCount, 'bill', 'bills')} to pay`
            : `${plural(cards.cards.length, 'card', 'cards')} · no bill waiting`
        }
        amount={
          <>
            <Amount value={cards.totalOutstanding} role="row" className="text-ink" />
            <div className="text-caption text-ink-muted">owed</div>
          </>
        }
      />
    ),
    loans && loans.count > 0 && (
      <LedgerRow
        key="debts"
        to="/money/debts"
        primary="Debts"
        secondary={
          loans.tbdCount > 0
            ? `${plural(loans.count, 'loan', 'loans')} · ${plural(loans.tbdCount, 'has', 'have')} no confirmed terms`
            : plural(loans.count, 'loan', 'loans')
        }
        amount={
          <>
            <Amount value={loans.bankEmiTotal} role="row" className="text-ink" />
            <div className="text-caption text-ink-muted">a month</div>
          </>
        }
      />
    ),
    investments && investments.count > 0 && (
      <LedgerRow
        key="investments"
        to="/money/investments"
        primary="Investments"
        secondary={
          investments.valuationState === 'NONE_UPDATED'
            ? `${plural(investments.count, 'holding', 'holdings')} · not valued yet`
            : plural(investments.count, 'holding', 'holdings')
        }
        amount={
          <>
            <Amount value={investments.totalInvested} role="row" className="text-ink" />
            <div className="text-caption text-ink-muted">put in</div>
          </>
        }
      />
    ),
    cover && cover.policies > 0 && (
      <LedgerRow
        key="cover"
        to="/money/insurance"
        primary="Insurance"
        secondary={
          cover.lapsed > 0 ? (
            <span className="text-attention">{`${plural(cover.policies, 'policy', 'policies')} · ${cover.lapsed} lapsed`}</span>
          ) : cover.renewingSoon > 0 ? (
            `${plural(cover.policies, 'policy', 'policies')} · ${cover.renewingSoon} renewing soon`
          ) : (
            plural(cover.policies, 'policy', 'policies')
          )
        }
        amount={
          <>
            <Amount value={cover.totalCover} role="row" className="text-ink" />
            <div className="text-caption text-ink-muted">covered</div>
          </>
        }
      />
    ),
  ].filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <section>
      <SectionHeader overCard>The rest of your money</SectionHeader>
      <div className="m-card flex flex-col">{rows}</div>
    </section>
  );
}
