import { Amount } from '@/components/Amount';
import { DetailHero } from '@/components/detail/DetailPage';
import { FactStrip, type Fact } from '@/components/FactStrip';
import { Skeleton } from '@/components/Skeleton';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import type { InsuranceSummaryResponse } from '@/types/insurance';

/**
 * What the user is covered for and what it costs (UI_UX_REVAMP_PLAN 4.7d). Cover is reassurance, not
 * money: it never counts towards net worth, and the page says so.
 */
export function CoverStanding({ summary, isLoading }: { summary?: InsuranceSummaryResponse; isLoading: boolean }) {
  const coverDoc = useDocAnchor('cover.policy');
  const premiumDoc = useDocAnchor('cover.premium');

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col gap-space-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const facts: Fact[] = [
    {
      label: 'Costs you a month',
      // Null is unknown, never ₹0 - a policy whose premium was never recorded still costs
      // something, and ₹0 would quietly improve the monthly picture.
      value: <Amount value={summary.monthlyPremium} role="row" />,
    },
    { label: summary.policies === 1 ? 'Policy' : 'Policies', value: summary.policies },
  ];
  if (summary.renewingSoon > 0) facts.push({ label: 'Renewing soon', value: summary.renewingSoon });
  if (summary.lapsed > 0) facts.push({ label: 'Lapsed', value: <span className="text-attention">{summary.lapsed}</span> });

  return (
    <section className="flex flex-col gap-space-5 max-md:gap-space-4">
      <div {...coverDoc}>
        <DetailHero
          label="Covered for"
          sentence={`across ${summary.policies} ${summary.policies === 1 ? 'policy' : 'policies'}. What you wouldn’t have to find yourself.`}
        >
          <Amount value={summary.totalCover} role="hero" className="text-ink" />
        </DetailHero>
      </div>

      <div {...premiumDoc}>
        <FactStrip facts={facts} className="border-y border-line" />
      </div>

      <p className="max-w-[40rem] text-caption text-ink-muted">
        {summary.monthlyPremium == null ? 'One premium isn’t recorded yet, so the monthly cost is left blank rather than guessed. ' : 'Premiums are spread over the year. '}
        Cover isn’t money you have, so it never counts towards net worth.
      </p>
    </section>
  );
}
