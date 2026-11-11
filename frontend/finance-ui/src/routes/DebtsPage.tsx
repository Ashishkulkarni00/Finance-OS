import { useState } from 'react';
import { TabToolbar } from '@/features/money/components/TabToolbar';
import type { ReactNode } from 'react';
import { Landmark, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { AddLoanSheet } from '@/features/debts/components/AddLoanSheet';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { GroupBand } from '@/components/GroupBand';
import { Amount } from '@/components/Amount';
import { DebtStanding } from '@/features/debts/components/DebtStanding';
import { DebtsNeedsALook } from '@/features/debts/components/DebtsNeedsALook';
import { LoanRow } from '@/features/debts/components/LoanRow';
import { useGetLoansQuery, useGetLoanSummaryQuery } from '@/services/loanService';

/** A full-width hairline above each section - the same separation as Months and
 *  Accounts. */
function Divided({ children }: { children: ReactNode }) {
  // `divided`: on a phone the rule goes and the section inside becomes a card (index.css).
  return <div className="divided border-t border-line pt-space-8 empty:hidden max-md:border-t-0 max-md:pt-0">{children}</div>;
}

/**
 * "Debts" - loans and EMIs, from the source workbook's Loans sheet, whose thesis this page
 * keeps: <em>"Nothing here is invented."</em> Confidence gates what the server derives at
 * all (LoanConfidence.java), so a loan with no real terms shows no payoff date rather than
 * one computed from a guess.
 *
 * <p>Brought in line with Today, the Ledger, Months and Accounts: a header that names
 * the screen, a "How Debts works" guide, a dismissible primer, the position as one panel,
 * then Needs a look and the loans under their own rules. The note about EMIs not being
 * split into principal and interest moved from the foot of the page into the guide.
 *
 * <p>Loans stay grouped by how the EMI reaches you - debited from a bank account, or
 * billed inside a card - because collapsing the two is how you end up believing more
 * leaves your account each month than really does.
 */
export default function DebtsPage() {
  const { data: loansPage, isLoading, isError, refetch } = useGetLoansQuery();
  const { data: summary, isLoading: summaryLoading } = useGetLoanSummaryQuery();
  const [adding, setAdding] = useState(false);

  const loans = (loansPage?.content ?? []).filter((l) => l.status !== 'CLOSED');
  const fromBank = loans.filter((l) => l.paidVia === 'BANK');
  const onCard = loans.filter((l) => l.paidVia === 'CARD');

  if (!isLoading && !isError && loans.length === 0) {
    return (
      <>
        <EmptyState
          icon={Landmark}
          headline="No debts recorded."
          body="Add a loan and its EMI, and this becomes a countdown to the date you're free of it."
          action={
            <Button variant="secondary" onClick={() => setAdding(true)}>
              <Plus size={16} strokeWidth={1.5} />
              Add a loan
            </Button>
          }
        />
        <AddLoanSheet open={adding} onClose={() => setAdding(false)} />
      </>
    );
  }

  return (
    <>
      <TabToolbar subtitle="Every loan you’re paying off, what leaves each month, and when you’re free of it." helpTopic="loans.how-debts-works">
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          <Plus size={14} strokeWidth={1.5} />
          Add a loan
        </Button>
      </TabToolbar>

      {isError ? (
        <ErrorState message="We couldn't load your loans. Check your connection and try again." onRetry={refetch} />
      ) : (
        <>
          <DebtStanding summary={summary} isLoading={summaryLoading} />

          <Divided>
            {isLoading ? <Skeleton className="h-20 w-full rounded-xl" /> : <DebtsNeedsALook loans={loans} />}
          </Divided>

          <Divided>
            <section>
              <SectionHeader trailing={`${loans.length} ${loans.length === 1 ? 'loan' : 'loans'}`}>The loans</SectionHeader>

              {isLoading ? (
                <div className="flex flex-col gap-space-2">
                  {[0, 1].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-space-5 md:gap-space-8">
                  {fromBank.length > 0 && (
                    <div className="flex flex-col">
                      <GroupBand
                        label="Debited from a bank account"
                        count={fromBank.length}
                        figure={summary && <Amount value={summary.bankEmiTotal} role="caption" className="text-ink" />}
                        caption="a month"
                      />
                      {fromBank.map((loan) => (
                        <LoanRow key={loan.id} loan={loan} />
                      ))}
                    </div>
                  )}

                  {onCard.length > 0 && (
                    <div className="flex flex-col">
                      <GroupBand
                        label="Billed to a card"
                        count={onCard.length}
                        figure={summary && <Amount value={summary.cardEmiTotal} role="caption" className="text-ink" />}
                        caption="a month · inside the card bill"
                      />
                      {onCard.map((loan) => (
                        <LoanRow key={loan.id} loan={loan} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </Divided>
        </>
      )}

      <AddLoanSheet open={adding} onClose={() => setAdding(false)} />
    </>
  );
}