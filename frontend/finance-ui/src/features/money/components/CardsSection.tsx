import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { LedgerRow } from '@/components/LedgerRow';
import { formatMoney } from '@/lib/money';
import { billLine, TONE_CLASS } from '@/features/cards/cardFormat';
import { useGetCreditCardsQuery } from '@/services/cardService';

/**
 * Accounts' view of the credit cards - what's owed on each and where its bill stands, one
 * query for all of them. The card's own page (Cards) has the bill, statements and EMIs.
 */
export function CardsSection() {
  const navigate = useNavigate();
  const { data } = useGetCreditCardsQuery();
  if (!data || data.cards.length === 0) return null;

  return (
    <section>
      <SectionHeader
        trailing={
          <button type="button" onClick={() => navigate('/cards')} className="text-accent underline-offset-4 hover:underline">
            Open Cards
          </button>
        }
      >
        Credit cards
      </SectionHeader>
      <div className="flex flex-col">
        {data.cards.map((card) => {
          const bill = billLine(card);
          return (
            <LedgerRow
              key={card.accountId}
              to={`/cards/${card.accountId}`}
              primary={card.name}
              secondary={<span className={TONE_CLASS[bill.tone]}>{bill.text}</span>}
              meta={card.availableCredit != null && <div className="num text-ink-soft">{formatMoney(card.availableCredit)} credit left</div>}
              amount={
                <>
                  <Amount value={card.outstanding} role="row" className="text-ink" />
                  <div className="text-caption text-ink-muted">owed</div>
                </>
              }
            />
          );
        })}
      </div>
    </section>
  );
}
