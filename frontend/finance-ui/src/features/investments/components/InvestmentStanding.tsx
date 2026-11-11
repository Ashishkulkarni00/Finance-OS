import { Amount } from '@/components/Amount';
import { Disclosure } from '@/components/Disclosure';
import { DetailHero } from '@/components/detail/DetailPage';
import { FactStrip, type Fact } from '@/components/FactStrip';
import { Skeleton } from '@/components/Skeleton';
import { formatPercent } from '@/lib/money';
import type { InvestmentSummaryResponse } from '@/types/investment';

const TINTS = [1, 0.7, 0.5, 0.36, 0.26, 0.2];
const tint = (i: number) => TINTS[Math.min(i, TINTS.length - 1)];

/**
 * What has been put to work and how it is doing (UI_UX_REVAMP_PLAN 4.7c). Growth is only stated once
 * something has been valued - until then the page says how to get it, never a ₹0. It is worded and
 * signed, not coloured: a gain is not green and a fall is not red (DESIGN_SYSTEM 4 rule 3). Where
 * the money is spread is one tap away, not a second panel.
 */
export function InvestmentStanding({ summary, isLoading }: { summary: InvestmentSummaryResponse | undefined; isLoading: boolean }) {
  if (isLoading || !summary) {
    return (
      <div className="flex flex-col gap-space-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const anyValued = summary.valuedCount > 0;
  const gainUp = summary.totalGain != null && Number(summary.totalGain) >= 0;
  const addsMonthly = Number(summary.monthlyContributionTotal) > 0;
  const anyLocked = Number(summary.illiquidTotal) > 0;

  const facts: Fact[] = [];
  if (anyValued) {
    facts.push({ label: 'Worth today', value: <Amount value={summary.totalCurrentValue} role="row" /> });
    facts.push({
      label: gainUp ? 'Grown by' : 'Down by',
      value: (
        <span className="inline-flex items-baseline gap-space-2">
          <Amount value={summary.totalGain} role="row" signed />
          {summary.totalGainPercent != null && <span className="num text-label text-ink-muted">{formatPercent(summary.totalGainPercent)}</span>}
        </span>
      ),
    });
  }
  facts.push({ label: 'Ready if you need it', value: <Amount value={summary.liquidTotal} role="row" /> });
  if (anyLocked) facts.push({ label: 'Growing for later', value: <Amount value={summary.illiquidTotal} role="row" /> });

  return (
    <section className="flex flex-col gap-space-5 max-md:gap-space-4">
      <DetailHero
        label="Put to work so far"
        sentence={
          <>
            across {summary.count} {summary.count === 1 ? 'holding' : 'holdings'}
            {addsMonthly && (
              <>
                {' · '}
                <Amount value={summary.monthlyContributionTotal} role="body" className="text-ink" /> more added every month
              </>
            )}
          </>
        }
      >
        <Amount value={summary.totalInvested} role="hero" className="text-ink" />
      </DetailHero>

      <FactStrip facts={facts} className="border-y border-line" />

      {anyValued ? (
        summary.valuationState === 'PARTLY_UPDATED' && (
          <p className="max-w-[40rem] text-caption text-ink-muted">
            Counting only the {summary.valuedCount} of {summary.count} holdings you’ve valued.
          </p>
        )
      ) : (
        <p className="max-w-[40rem] text-caption text-ink-muted">
          Growth shows up here once you add what your holdings are worth — tap <strong className="font-medium text-ink">Value</strong> on
          each one below, whenever you check a statement.
        </p>
      )}

      {summary.allocation.length > 0 && (
        <Disclosure storageKey="kosh.investments.allocation" label="Where it’s put" summary="share of each holding">
          <div className="max-w-[36rem]">
            <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full" aria-hidden>
              {summary.allocation.map((a, i) => (
                <div
                  key={a.investmentId}
                  className="h-full first:rounded-l-full last:rounded-r-full"
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
          </div>
        </Disclosure>
      )}
    </section>
  );
}
