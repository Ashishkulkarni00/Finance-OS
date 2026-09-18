import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { formatMoney, formatPercent } from '@/lib/money';
import { cn } from '@/lib/cn';
import type { InvestmentSummaryResponse } from '@/types/investment';

/** Descending tints of the invest hue, largest holding darkest - the ramp encodes rank
 *  only, the same rule as the Months page's day-to-day bar. */
const TINTS = [1, 0.7, 0.5, 0.36, 0.26, 0.2];
const tint = (i: number) => TINTS[Math.min(i, TINTS.length - 1)];

/**
 * Zone 1 - money put to work, as one panel: what's gone in and how it's growing on the
 * left, where it's put on the right.
 *
 * <p>Deliberately a different register from Debts and Accounts. Every other screen's top
 * figure is a position to keep an eye on; this one is an achievement, so it's set in the
 * invest hue rather than ink, and the language is about money working ("put to work",
 * "added every month") rather than balances.
 *
 * <p>What it still refuses to do is manufacture growth. "Up by" appears only once
 * something has been valued, and is set only against what went into the valued holdings
 * (see InvestmentSummary) - a gain computed against holdings nobody has looked at would
 * invent a loss, or a win, out of missing data. Until then the positive thing it can
 * truthfully say is how steadily money is going in.
 */
export function InvestmentStanding({ summary, isLoading }: { summary: InvestmentSummaryResponse | undefined; isLoading: boolean }) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-space-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="flex flex-col gap-space-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  // Presence and direction checks, not arithmetic.
  const anyValued = summary.valuedCount > 0;
  const gainUp = summary.totalGain != null && Number(summary.totalGain) >= 0;
  const addsMonthly = Number(summary.monthlyContributionTotal) > 0;
  const anyLocked = Number(summary.illiquidTotal) > 0;

  return (
    <div className="grid grid-cols-1 gap-space-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-0">
      <div className="flex flex-col gap-space-2 lg:pr-space-8">
        <span className="text-micro uppercase tracking-[0.08em] text-invest">Put to work so far</span>
        <Amount value={summary.totalInvested} role="hero" className="text-invest" />
        <p className="text-body text-ink-soft">
          across {summary.count} {summary.count === 1 ? 'holding' : 'holdings'}
          {addsMonthly && (
            <>
              {' · '}
              <Amount value={summary.monthlyContributionTotal} role="body" className="text-ink" /> more added every month
            </>
          )}
        </p>

        {anyValued ? (
          <div className="mt-space-2 flex flex-col gap-space-1">
            <span className={cn('inline-flex items-baseline gap-space-2', gainUp ? 'text-positive' : 'text-critical')}>
              <span className="inline-flex items-baseline">
                {gainUp && <span className="num text-section">+</span>}
                <Amount value={summary.totalGain} role="section" className={gainUp ? 'text-positive' : 'text-critical'} />
              </span>
              {summary.totalGainPercent != null && (
                <span className="num text-label">{formatPercent(summary.totalGainPercent)}</span>
              )}
            </span>
            <span className="text-caption text-ink-muted">
              {gainUp ? 'grown' : 'down'} — worth <Amount value={summary.totalCurrentValue} role="caption" /> today
              {summary.valuationState === 'PARTLY_UPDATED' &&
                `, counting only the ${summary.valuedCount} of ${summary.count} holdings you’ve valued`}
            </span>
          </div>
        ) : (
          <p className="mt-space-2 max-w-[36rem] text-caption text-ink-muted">
            Growth shows up here once you add what your holdings are worth — tap <strong className="font-medium text-ink">Value</strong>{' '}
            on each one below, whenever you check a statement.
          </p>
        )}
      </div>

      <div className="border-t border-line pt-space-6 lg:border-l lg:border-t-0 lg:pl-space-8 lg:pt-0">
        <span className="mb-space-3 block text-micro uppercase tracking-[0.08em] text-ink-muted">Where it’s put</span>

        {summary.allocation.length > 0 && (
          <>
            <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full" aria-hidden>
              {summary.allocation.map((a, i) => (
                <div
                  key={a.investmentId}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  // `share` is the server's fraction; scaling it to a percentage width is
                  // presentation, the same licence the day-to-day spending bar takes.
                  style={{ width: `${(a.share ?? 0) * 100}%`, background: 'var(--invest)', opacity: tint(i) }}
                />
              ))}
            </div>

            <div className="mt-space-3 grid grid-cols-[auto_minmax(0,1fr)_3rem_auto] items-center gap-x-space-2 gap-y-space-2">
              {summary.allocation.map((a, i) => (
                <div key={a.investmentId} className="contents">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--invest)', opacity: tint(i) }} />
                  <span className="truncate text-label text-ink">
                    {a.name}
                    {!a.liquid && <span className="text-caption text-ink-muted"> · for later</span>}
                  </span>
                  <span className="num text-right text-caption text-ink-muted">{formatPercent(a.share)}</span>
                  <span className="text-right">
                    <Amount value={a.totalInvested} role="caption" className="text-ink" />
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {anyLocked && (
          <p className="mt-space-3 text-caption text-ink-muted">
            {formatMoney(summary.liquidTotal)} ready if you need it · {formatMoney(summary.illiquidTotal)} growing for later
          </p>
        )}
      </div>
    </div>
  );
}
