import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import type { InsuranceSummaryResponse } from '@/types/insurance';

/**
 * What you're covered for, and what it costs.
 *
 * <p>The two figures are deliberately not added to anything. Cover is **not an asset**
 * (ADR-0016) - it is money you would not have to find, not money you have - and it is not
 * a single pot either: ₹5L of health plus ₹1cr of life is not a sum you could ever spend.
 * So it is shown as cover, beside its cost, and never near net worth.
 */
export function CoverStanding({ summary, isLoading }: { summary?: InsuranceSummaryResponse; isLoading: boolean }) {
  if (isLoading || !summary) {
    return <Skeleton className="h-20 w-full" />;
  }

  return (
    <div className="flex flex-col gap-space-4">
      <div className="flex flex-wrap items-start gap-space-8">
        <div className="flex flex-col items-start gap-space-2">
          <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Covered for</span>
          <Amount value={summary.totalCover} role="hero" className="text-ink" />
          <span className="text-caption text-ink-muted">
            across {summary.policies} {summary.policies === 1 ? 'policy' : 'policies'}
          </span>
        </div>
        <div className="flex flex-col items-start gap-space-2">
          <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Costs you</span>
          {/* Null is unknown, never ₹0 - a policy whose premium was never recorded still
              costs something, and ₹0 would quietly improve the monthly picture. */}
          <Amount value={summary.monthlyPremium} role="section" className="text-ink" />
          <span className="text-caption text-ink-muted">
            {summary.monthlyPremium == null ? 'one premium isn’t recorded yet' : 'a month, spread over the year'}
          </span>
        </div>
      </div>

      <p className="text-caption text-ink-muted">
        What you wouldn’t have to find yourself. Cover isn’t money you have, so it never counts towards net worth.
      </p>
    </div>
  );
}
