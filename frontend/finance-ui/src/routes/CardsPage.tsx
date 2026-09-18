import { useState } from 'react';
import { CreditCard, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { Amount } from '@/components/Amount';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LedgerRow, MetaFacts } from '@/components/LedgerRow';
import { Row } from '@/components/Row';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { Statement, StatementRow } from '@/components/Statement';
import { CreditCardSheet } from '@/features/cards/components/CreditCardSheet';
import { DebitCardSheet } from '@/features/cards/components/DebitCardSheet';
import { billLine, cardIdentity, formatShare, TONE_CLASS } from '@/features/cards/cardFormat';
import { formatMoney } from '@/lib/money';
import { useGetCreditCardsQuery, useGetDebitCardsQuery } from '@/services/cardService';
import type { DebitCardResponse } from '@/types/card';

/**
 * Cards - credit and debit, which work nothing alike.
 *
 * <p>A <strong>credit card</strong> is its own account: a swipe is an expense on it the day
 * it happens, what's owed is already taken out of what's free this month, and paying the
 * bill is a transfer. It isn't linked to a bank account.
 *
 * <p>A <strong>debit card</strong> is a way of spending from one bank account. It has no
 * balance, so it's listed under that account and changes nothing that's calculated.
 */
export default function CardsPage() {
  const { data: overview, isLoading, isError, refetch } = useGetCreditCardsQuery();
  const { data: debitCards } = useGetDebitCardsQuery();
  const [addingCredit, setAddingCredit] = useState(false);
  const [debitSheet, setDebitSheet] = useState<{ card: DebitCardResponse | null } | null>(null);

  const cards = overview?.cards ?? [];
  const share = formatShare(overview?.utilisation);

  const banks = new Map<number, { name: string; cards: DebitCardResponse[] }>();
  for (const card of debitCards ?? []) {
    const group = banks.get(card.account.id) ?? { name: card.account.name, cards: [] };
    group.cards.push(card);
    banks.set(card.account.id, group);
  }

  return (
    <div className="flex flex-col gap-space-8">
      <div className="flex items-start justify-between gap-space-4">
        <div className="flex flex-col gap-space-1">
          <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Cards</span>
          <span className="text-title text-ink">Credit and debit cards</span>
          <span className="text-caption text-ink-muted">What’s owed on each card, and what’s due</span>
        </div>
        <div className="flex shrink-0 items-center gap-space-2">
          <Button variant="secondary" size="sm" onClick={() => setDebitSheet({ card: null })}>
            <Plus size={14} strokeWidth={1.5} />
            Debit card
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setAddingCredit(true)}>
            <Plus size={14} strokeWidth={1.5} />
            Credit card
          </Button>
        </div>
      </div>

      <div className="grid gap-space-4 sm:grid-cols-2">
        <div className="rounded-lg border border-line p-space-4">
          <p className="text-label text-ink">Credit card</p>
          <p className="mt-space-1 text-caption text-ink-muted">
            Its own account, not linked to a bank. Record swipes as expenses on the card. What’s owed is already taken out of
            what’s free this month, and paying the bill is a transfer, so it’s never counted twice.
          </p>
        </div>
        <div className="rounded-lg border border-line p-space-4">
          <p className="text-label text-ink">Debit card</p>
          <p className="mt-space-1 text-caption text-ink-muted">
            Spends straight from its bank account and has no balance of its own. Record those spends as expenses from the bank
            account.
          </p>
        </div>
      </div>

      {isError ? (
        <ErrorState message="We couldn't load your cards." onRetry={refetch} />
      ) : isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          {overview && cards.length > 0 && (
            <section aria-label="Your credit cards at a glance" className="rounded-xl border border-line bg-surface p-space-6">
              <Statement notes>
                <StatementRow
                  label="Owed on credit cards"
                  value={overview.totalOutstanding}
                  note="Already taken out of what’s free this month."
                />
                <StatementRow
                  label="Bills to pay"
                  value={overview.billsDueTotal}
                  note={
                    overview.billsDueCount === 0
                      ? 'No recorded statement is waiting to be paid.'
                      : `${overview.billsDueCount} ${overview.billsDueCount === 1 ? 'statement' : 'statements'} not paid in full yet.`
                  }
                />
                {Number(overview.emiMonthlyTotal) > 0 && (
                  <StatementRow label="Card EMIs a month" value={overview.emiMonthlyTotal} note="Charged to your cards and paid through their bills." />
                )}
                <StatementRow
                  variant="subtotal"
                  label="Credit available"
                  value={overview.totalAvailable}
                  note={share ? `Of ${formatMoney(overview.totalLimit)} in limits · ${share} used` : undefined}
                />
              </Statement>
            </section>
          )}

          <section>
            <SectionHeader trailing={cards.length > 0 ? `${cards.length} ${cards.length === 1 ? 'card' : 'cards'}` : undefined}>
              Credit cards
            </SectionHeader>
            {cards.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                headline="No credit cards yet."
                body="Add a card with its limit, statement day and due day. Kosh then tracks what’s owed, what each bill still needs, and the EMIs charged to it."
                action={
                  <Button variant="secondary" onClick={() => setAddingCredit(true)}>
                    <Plus size={16} strokeWidth={1.5} />
                    Add a credit card
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col">
                {cards.map((card) => {
                  const bill = billLine(card);
                  return (
                    <LedgerRow
                      key={card.accountId}
                      to={`/cards/${card.accountId}`}
                      leading={<CreditCard size={18} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />}
                      primary={card.lastFour ? `${card.name} •• ${card.lastFour}` : card.name}
                      secondary={<span className={TONE_CLASS[bill.tone]}>{bill.text}</span>}
                      meta={
                        card.setUp && (
                          <MetaFacts
                            items={[
                              { label: 'Limit', value: formatMoney(card.creditLimit) },
                              { label: 'Available', value: formatMoney(card.availableCredit) },
                            ]}
                          />
                        )
                      }
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
            )}
          </section>

          <section>
            <SectionHeader trailing={debitCards && debitCards.length > 0 ? `${debitCards.length}` : undefined}>Debit cards</SectionHeader>
            {banks.size === 0 ? (
              <p className="text-body text-ink-soft">
                No debit cards recorded.{' '}
                <button type="button" onClick={() => setDebitSheet({ card: null })} className="text-accent hover:underline">
                  Add one
                </button>{' '}
                to see which cards reach which bank account.
              </p>
            ) : (
              <div className="flex flex-col gap-space-6">
                {[...banks.entries()].map(([accountId, group]) => (
                  <div key={accountId}>
                    <p className="mb-space-1 text-micro uppercase tracking-[0.08em] text-ink-muted">Spends from {group.name}</p>
                    <div className="flex flex-col">
                      {group.cards.map((card) => (
                        <Row
                          key={card.id}
                          primary={card.name}
                          secondary={cardIdentity(card) || 'No details recorded'}
                          trailing={
                            <button
                              type="button"
                              onClick={() => setDebitSheet({ card })}
                              aria-label={`Edit ${card.name}`}
                              className="rounded-md p-space-1 text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
                            >
                              <Pencil size={15} strokeWidth={1.5} aria-hidden />
                            </button>
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <CreditCardSheet key={`add-credit-${addingCredit}`} open={addingCredit} onClose={() => setAddingCredit(false)} />
      {debitSheet && <DebitCardSheet open card={debitSheet.card} onClose={() => setDebitSheet(null)} />}
    </div>
  );
}
