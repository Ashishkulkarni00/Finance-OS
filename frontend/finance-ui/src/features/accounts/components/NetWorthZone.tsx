import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Amount } from '@/components/Amount';
import { DetailHero } from '@/components/detail/DetailPage';
import { SectionRule } from '@/components/SectionRule';
import { Skeleton } from '@/components/Skeleton';
import { Statement, StatementRow } from '@/components/Statement';
import { formatMoney } from '@/lib/money';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import { useGetInvestmentSummaryQuery } from '@/services/investmentService';
import { useGetLoansQuery } from '@/services/loanService';
import { useGetMomentumQuery } from '@/services/momentumService';
import type { LoanResponse } from '@/types/loan';
import type { AccountResponse } from '@/types/api';
import type { CashPositionResponse, NetWorthResponse } from '@/types/position';

interface NetWorthZoneProps {
  netWorth: NetWorthResponse | undefined;
  cash: CashPositionResponse | undefined;
  accounts: AccountResponse[];
  isLoading: boolean;
  isError: boolean;
}

type Unconfirmed = { account: AccountResponse; label: 'estimated' | 'unknown' };

/**
 * The balances net worth rests on that nobody confirmed.
 *
 * <p><strong>A loan is judged by the loan, not its account.</strong> Since FIX_BACKLOG 1.5
 * (2026-11-08) net worth reads each loan's derived outstanding - the balance stated on the
 * loan, less the EMIs recorded since - so the LOAN account's own opening balance no longer
 * enters the figure. Judging loans by that flag listed five "unconfirmed" balances when four
 * of the five loans were marked confirmed from their statements (user, 2026-11-09). A LOAN
 * account with no loan record still falls back to its opening flag.
 */
function unconfirmedBalances(accounts: AccountResponse[], loans: LoanResponse[] | undefined): Unconfirmed[] {
  const loanByAccount = new Map((loans ?? []).map((l) => [l.account.id, l]));
  const out: Unconfirmed[] = [];
  for (const a of accounts) {
    if (a.archived || !a.includeInNetWorth) continue;
    const loan = a.type === 'LOAN' ? loanByAccount.get(a.id) : undefined;
    if (loan) {
      if (loan.status === 'CLOSED' || loan.confidence === 'CONFIRMED') continue;
      out.push({ account: a, label: loan.confidence === 'ESTIMATED' ? 'estimated' : 'unknown' });
    } else if (a.openingConfidence !== 'CONFIRMED') {
      out.push({ account: a, label: a.openingConfidence === 'ESTIMATED' ? 'estimated' : 'unknown' });
    }
  }
  return out;
}

/** A statement label with what the line is made of beneath it. Dropped on a phone: the name says
 *  enough there, and a note under each row made the block three times as tall. */
function Labelled({ children, note }: { children: ReactNode; note: string }) {
  return (
    <>
      {children}
      <span className="block text-caption text-ink-muted max-md:hidden">{note}</span>
    </>
  );
}

/**
 * The top of Money's Overview, in the same grammar as Today and Month (2026-11-11): a figure, its
 * working as ruled rows, then the next question under its own rule - no boxes.
 *
 * <p><strong>Net worth</strong> is the figure, and it is red when negative: the user asked for that
 * back (2026-11-11) because it is the thing that immediately brings attention. Owned and Owed sit
 * directly under it as the two rows that make it, so the sentence "₹92,652 owned · ₹3,07,071 owed"
 * and the separate "How is it worked out?" trigger are no longer needed.
 *
 * <p><strong>What it leaves out is said plainly</strong>, directly under the working: holdings kept
 * outside any account (investments, an employer-deducted NPS) have no balance, so they are not in
 * net worth at all, and "−₹2,14,419" must not read as the whole story. Net worth also carries the
 * confidence line ACCOUNTS_EXPERIENCE §5 always called for: each unconfirmed starting balance is
 * named and linked, so "approximate" is a to-do, not a shrug.
 *
 * <p><strong>"In bank and cash"</strong> is the other question - what can actually be moved today -
 * as its own three-row sum (held − set aside = yours to move). "Held" counts spendable accounts
 * only (`CashPosition`: "every spendable bank and cash account"), so the label says so; it was
 * "Held · 3 accounts" beside a register of four.
 */
export function NetWorthZone({ netWorth, cash, accounts, isLoading, isError }: NetWorthZoneProps) {
  const { data: investments } = useGetInvestmentSummaryQuery();
  const { data: loansPage } = useGetLoansQuery();
  const { data: momentum } = useGetMomentumQuery();
  const netWorthDoc = useDocAnchor('networth.total');

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="mt-space-3 h-16 w-full" />
      </div>
    );
  }

  const unconfirmed = unconfirmedBalances(accounts, loansPage?.content);
  const outsideTotal = investments && Number(investments.outsideLedgerTotal) > 0 ? investments.outsideLedgerTotal : null;
  // The server's own "what went right" line for debt, when there is one - a direction word plus a
  // figure it computed. Shown only when it is good news; a bad month says nothing here.
  const progress = (momentum ?? []).find((m) => m.key === 'debt' && m.direction === 'BETTER');

  return (
    <div className="flex flex-col gap-space-6">
      <section className="flex flex-col gap-space-3" {...netWorthDoc}>
        {isError || !netWorth ? (
          <p className="text-body text-ink-soft">Net worth isn’t available right now.</p>
        ) : (
          <>
            <DetailHero label="Net worth">
              <Amount
                value={netWorth.netWorth}
                role="hero"
                // Negative takes the critical colour from `emphasiseNegative`; an explicit ink class would
                // out-rank it (classes are joined, not merged), so ink is only passed when positive.
                className={Number(netWorth.netWorth) < 0 ? undefined : 'text-ink'}
                emphasiseNegative
              />
            </DetailHero>
            <div className="max-w-[44rem]">
              <Statement dense>
                <StatementRow label={<Labelled note="everything you hold in your accounts">Owned</Labelled>} value={netWorth.totalAssets} />
                <StatementRow
                  label={<Labelled note="loans, at what is still to repay, and what is owed on cards">Owed</Labelled>}
                  value={netWorth.totalLiabilities}
                  deduct
                />
              </Statement>
            </div>
            {outsideTotal && (
              <p className="max-w-[40rem] text-caption text-ink-soft">
                Not counted: <span className="num text-ink">{formatMoney(outsideTotal)}</span> put into investments held outside your
                accounts{investments?.valuationState === 'NONE_UPDATED' ? ', none valued yet' : ''}.{' '}
                <Link to="/money/investments" className="text-accent underline-offset-2 hover:underline">
                  Investments
                </Link>
              </p>
            )}
            {unconfirmed.length > 0 && (
              <p className="max-w-[40rem] text-caption text-attention">
                Approximate —{' '}
                {unconfirmed.length === 1 ? 'the starting balance of ' : `${unconfirmed.length} starting balances aren’t confirmed: `}
                {unconfirmed.map(({ account: a, label }, i) => (
                  <Fragment key={a.id}>
                    {i > 0 && ', '}
                    <Link to={`/accounts/${a.id}`} className="underline underline-offset-2 hover:text-ink">
                      {a.name}
                    </Link>
                    <span className="text-ink-muted"> ({label})</span>
                  </Fragment>
                ))}
                {unconfirmed.length === 1 ? ' isn’t confirmed.' : '.'}
              </p>
            )}
            {progress && <p className="max-w-[40rem] text-caption text-positive">{progress.headline}</p>}
          </>
        )}
      </section>

      <section>
        <SectionRule>In bank and cash</SectionRule>
        {cash ? (
          <>
            <div className="max-w-[44rem]">
              <Statement dense>
                <StatementRow
                  label={`Held in ${cash.accountCount} spendable ${cash.accountCount === 1 ? 'account' : 'accounts'}`}
                  value={cash.heldTotal}
                />
                <StatementRow label="Set aside" value={cash.reservedTotal} deduct />
                <StatementRow variant="subtotal" label="Yours to move" value={cash.unreservedTotal} emphasiseNegative />
              </Statement>
            </div>
            <p className="mt-space-2 max-w-[40rem] text-caption text-ink-muted">
              {Number(cash.cardLiability) > 0 && (
                <>
                  <Amount value={cash.cardLiability} role="caption" className="text-ink" /> is owed on cards, kept separate.{' '}
                </>
              )}
              Before this cycle’s bills —{' '}
              <Link to="/month" className="text-accent underline-offset-2 hover:underline">
                Month
              </Link>{' '}
              takes those out.
            </p>
          </>
        ) : (
          <Skeleton className="h-16 w-full" />
        )}
      </section>
    </div>
  );
}
