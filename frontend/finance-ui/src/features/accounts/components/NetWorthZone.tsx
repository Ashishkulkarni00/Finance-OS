import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { Statement, StatementRow } from '@/components/Statement';
import { formatMoney } from '@/lib/money';
import { useGetInvestmentSummaryQuery } from '@/services/investmentService';
import type { AccountResponse } from '@/types/api';
import type { CashPositionResponse, NetWorthResponse } from '@/types/position';

interface NetWorthZoneProps {
  netWorth: NetWorthResponse | undefined;
  cash: CashPositionResponse | undefined;
  accounts: AccountResponse[];
  isLoading: boolean;
  isError: boolean;
}

/** The accounts whose starting balance net worth rests on but nobody confirmed. */
function unconfirmedBalances(accounts: AccountResponse[]): AccountResponse[] {
  return accounts.filter((a) => !a.archived && a.includeInNetWorth && a.openingConfidence !== 'CONFIRMED');
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-space-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex flex-col gap-space-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const unconfirmed = unconfirmedBalances(accounts);
  // Comparisons for tone and presence, not arithmetic on money.
  const negative = netWorth ? Number(netWorth.netWorth) < 0 : false;
  const outsideTotal = investments && Number(investments.outsideLedgerTotal) > 0 ? investments.outsideLedgerTotal : null;

  return (
    <div className="grid grid-cols-1 gap-space-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-0">
      <div className="flex flex-col gap-space-2 lg:pr-space-8">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Net worth</span>
        {isError || !netWorth ? (
          <span className="text-body text-ink-soft">Net worth isn’t available right now.</span>
        ) : (
          <>
            <Amount value={netWorth.netWorth} role="hero" className={negative ? undefined : 'text-ink'} emphasiseNegative />
            <p className="text-body text-ink-soft">
              {formatMoney(netWorth.totalAssets)} owned · {formatMoney(netWorth.totalLiabilities)} owed
            </p>

            {unconfirmed.length > 0 && (
              <p className="max-w-[40rem] text-caption text-attention">
                Approximate —{' '}
                {unconfirmed.length === 1 ? 'the starting balance of ' : `${unconfirmed.length} starting balances aren’t confirmed: `}
                {unconfirmed.map((a, i) => (
                  <Fragment key={a.id}>
                    {i > 0 && ', '}
                    <Link to={`/accounts/${a.id}`} className="underline underline-offset-2 hover:text-ink">
                      {a.name}
                    </Link>
                    <span className="text-ink-muted"> ({a.openingConfidence === 'ESTIMATED' ? 'estimated' : 'unknown'})</span>
                  </Fragment>
                ))}
                {unconfirmed.length === 1 ? ' isn’t confirmed.' : '.'}
              </p>
            )}

            {outsideTotal && (
              <p className="max-w-[40rem] text-caption text-ink-muted">
                Not included: {formatMoney(outsideTotal)} put into investments held outside your accounts
                {investments?.valuationState === 'NONE_UPDATED' ? ', none valued yet' : ''}.{' '}
                <Link to="/investments" className="text-accent underline-offset-2 hover:underline">
                  Investments
                </Link>
              </p>
            )}
          </>
        )}
      </div>

      <div className="border-t border-line pt-space-6 lg:border-l lg:border-t-0 lg:pl-space-8 lg:pt-0">
        <span className="mb-space-2 block text-micro uppercase tracking-[0.08em] text-ink-muted">In bank and cash</span>
        {cash ? (
          <>
            <Statement>
              <StatementRow
                label={`Held · ${cash.accountCount} ${cash.accountCount === 1 ? 'account' : 'accounts'}`}
                value={cash.heldTotal}
              />
              <StatementRow label="Set aside" value={cash.reservedTotal} deduct />
              <StatementRow label="Yours to move" value={cash.unreservedTotal} variant="subtotal" emphasiseNegative />
              {Number(cash.cardLiability) > 0 && <StatementRow label="Owed on cards" value={cash.cardLiability} />}
            </Statement>
            <p className="mt-space-2 text-caption text-ink-muted">
              Before this cycle’s bills —{' '}
              <Link to="/month" className="text-accent underline-offset-2 hover:underline">
                Months
              </Link>{' '}
              takes those out.
            </p>
          </>
        ) : (
          <Skeleton className="h-28 w-full" />
        )}
      </div>
    </div>
  );
}
