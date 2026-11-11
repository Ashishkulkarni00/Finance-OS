import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Amount } from '@/components/Amount';
import { Breakdown } from '@/components/Breakdown';
import { DetailHero } from '@/components/detail/DetailPage';
import { FactStrip, type Fact } from '@/components/FactStrip';
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

/**
 * Zone 1 - the position at a glance, as one panel: net worth on the left, what's in
 * bank and cash (and how much of it is free) on the right. The Month overview's shape,
 * for the same reason - one figure says how you're doing, the other what you can move,
 * and reading only one of them was the default when they were stacked apart.
 *
 * <p>Net worth now carries the confidence line ACCOUNTS_EXPERIENCE §5 always called for
 * and never had. It's driven by each account's <em>opening balance confidence</em>, not by
 * loan confidence: net worth is a sum of account balances, so what makes it approximate
 * is a balance entered as an estimate or left unknown. (A loan's TBD confidence is about
 * its interest rate, which net worth never uses.) Each account is named and linked, so
 * "approximate" is a to-do, not a shrug.
 *
 * <p>A second line says what's <em>missing</em> rather than uncertain: holdings kept
 * outside any account (an employer-deducted NPS) have no balance, so net worth doesn't
 * include them at all. Saying so is cheaper than letting "−₹11,683" read as the whole story.
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
  const negative = netWorth ? Number(netWorth.netWorth) < 0 : false;
  const outsideTotal = investments && Number(investments.outsideLedgerTotal) > 0 ? investments.outsideLedgerTotal : null;
  // The server's own "what went right" line for debt, when there is one - a direction word plus a
  // figure it computed. Shown only when it is good news; a bad month says nothing here.
  const progress = (momentum ?? []).find((m) => m.key === 'debt' && m.direction === 'BETTER');

  const facts: Fact[] = cash
    ? [
        { label: `Held · ${cash.accountCount} ${cash.accountCount === 1 ? 'account' : 'accounts'}`, value: <Amount value={cash.heldTotal} role="row" /> },
        { label: 'Set aside', value: <Amount value={cash.reservedTotal} role="row" /> },
        { label: 'Yours to move', value: <Amount value={cash.unreservedTotal} role="row" emphasiseNegative /> },
        ...(Number(cash.cardLiability) > 0 ? [{ label: 'Owed on cards', value: <Amount value={cash.cardLiability} role="row" /> }] : []),
      ]
    : [];

  return (
    <section className="flex flex-col gap-space-5 max-md:gap-space-4" {...netWorthDoc}>
      {isError || !netWorth ? (
        <p className="text-body text-ink-soft">Net worth isn’t available right now.</p>
      ) : (
        <DetailHero label="Net worth">
          <Amount value={netWorth.netWorth} role="hero" className={negative ? undefined : 'text-ink'} emphasiseNegative />
          {/* The figure's own explanation goes straight under it; the notes about it follow. */}
          <p className="mt-space-1 text-label font-medium text-ink">
            {formatMoney(netWorth.totalAssets)} owned · {formatMoney(netWorth.totalLiabilities)} owed
          </p>
          {progress && (
            <p className="mt-space-2 max-w-[40rem] text-caption text-positive">{progress.headline}</p>
          )}
          {unconfirmed.length > 0 && (
            <p className="mt-space-2 max-w-[40rem] text-caption text-attention">
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
          {outsideTotal && (
            <p className="mt-space-2 max-w-[40rem] text-caption text-ink-muted">
              Not included: {formatMoney(outsideTotal)} put into investments held outside your accounts
              {investments?.valuationState === 'NONE_UPDATED' ? ', none valued yet' : ''}.{' '}
              <Link to="/money/investments" className="text-accent underline-offset-2 hover:underline">
                Investments
              </Link>
            </p>
          )}
        </DetailHero>
      )}

      {facts.length > 0 ? (
        <div className="flex flex-col gap-space-2">
          <span className="text-caption text-ink-muted">In bank and cash</span>
          <FactStrip facts={facts} className="border-y border-line" />
        </div>
      ) : (
        <Skeleton className="h-16 w-full" />
      )}

      <div className="flex flex-wrap items-baseline gap-x-space-5 gap-y-space-1 text-caption">
        {/* Registry B4 (UI_UX_REVAMP_PLAN 6.4): net worth is the server's assets less the server's
            liabilities (PositionServiceImpl.currentNetWorth, verified). All three are its fields. */}
        {netWorth && (
          <span className="text-accent">
            <Breakdown title="How net worth is worked out" trigger={<>How is {formatMoney(netWorth.netWorth)} worked out?</>}>
              <Statement notes>
                <StatementRow label="Owned" value={netWorth.totalAssets} note="Everything you hold in your accounts." />
                <StatementRow label="Owed" value={netWorth.totalLiabilities} deduct note="Loans, at what is still to repay, and what is owed on cards." />
                <StatementRow variant="total" label="Net worth" value={netWorth.netWorth} emphasiseNegative />
              </Statement>
            </Breakdown>
          </span>
        )}
        <span className="text-ink-muted">
          Before this cycle’s bills —{' '}
          <Link to="/month" className="text-accent underline-offset-2 hover:underline">
            Month
          </Link>{' '}
          takes those out.
        </span>
      </div>
    </section>
  );
}
