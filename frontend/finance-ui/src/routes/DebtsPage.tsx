import { useState } from 'react';
import type { ReactNode } from 'react';
import { CircleHelp, Landmark, Plus } from 'lucide-react';
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
import { DebtsPrimer } from '@/features/debts/components/DebtsPrimer';
import { DebtsGuideSheet } from '@/features/debts/components/DebtsGuideSheet';
import { LoanRow } from '@/features/debts/components/LoanRow';
import { useGetLoansQuery, useGetLoanSummaryQuery } from '@/services/loanService';

/** A full-width hairline above each section - the same separation as Months and
 *  Accounts. */
function Divided({ children }: { children: ReactNode }) {
  return <div className="border-t border-line pt-space-8 empty:hidden">{children}</div>;
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
  const [guideOpen, setGuideOpen] = useState(false);

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
    <div className="flex flex-col gap-space-8">
      <div className="flex flex-col gap-space-6">
        <div className="flex items-start justify-between gap-space-4">
          <div className="flex flex-col gap-space-1">
            <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Debts</span>
            <span className="text-title text-ink">What you owe, and when you’re free of it</span>
            <span className="text-caption text-ink-muted">
              {loans.length > 0 ? `${loans.length} active ${loans.length === 1 ? 'loan' : 'loans'}` : ' '}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-space-4">
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="flex items-center gap-space-1 rounded-md px-space-1 text-caption text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <CircleHelp size={14} strokeWidth={1.5} aria-hidden />
              How Debts works
            </button>
            <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
              <Plus size={14} strokeWidth={1.5} />
              Add a loan
            </Button>
          </div>
        </div>

        <DebtsPrimer onOpenGuide={() => setGuideOpen(true)} />
      </div>

      {isError ? (
        <ErrorState message="We couldn't load your loans. Check your connection and try again." onRetry={refetch} />
      ) : (
        <>
          <section aria-label="Your debts at a glance" className="rounded-xl border border-line bg-surface p-space-6">
            <DebtStanding summary={summary} isLoading={summaryLoading} />
          </section>

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
                <div className="flex flex-col gap-space-8">
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
      <DebtsGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
