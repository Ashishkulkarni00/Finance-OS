import { useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { CoverStanding } from '@/features/cover/components/CoverStanding';
import { PolicyRow } from '@/features/cover/components/PolicyRow';
import { PolicySheet } from '@/features/cover/components/PolicySheet';
import { useGetInsurancePoliciesQuery, useGetInsuranceSummaryQuery } from '@/services/insuranceService';
import type { InsurancePolicyResponse } from '@/types/insurance';

/** A full-width hairline above each section - the same separation as every other screen. */
function Divided({ children }: { children: ReactNode }) {
  return <div className="border-t border-line pt-space-8 empty:hidden">{children}</div>;
}

const TINT_STYLE = { backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' } as const;

/**
 * Cover that needs attention.
 *
 * <p>A lapsed policy is the one case where the money looks completely fine and the exposure
 * is total - nothing on any other screen would ever hint at it. A policy with no renewal
 * date is the quieter version of the same problem: cover that might already be gone.
 */
function CoverNeedsALook({ policies, onOpen }: { policies: InsurancePolicyResponse[]; onOpen: (p: InsurancePolicyResponse) => void }) {
  const cards = policies.flatMap((policy) => {
    if (policy.status === 'LAPSED') {
      return [
        {
          policy,
          title: `${policy.name} has lapsed`,
          because: `It renewed ${policy.renewsOn} and nothing says it was paid.`,
          consequence: 'If it’s gone, you’re carrying the whole cost yourself. Renew it, or update the date if it’s already done.',
        },
      ];
    }
    if (policy.status === 'RENEWS_SOON') {
      return [
        {
          policy,
          title: `${policy.name} renews in ${policy.daysToRenewal} days`,
          because: policy.premium ? `${policy.premium} falls due.` : 'The premium isn’t recorded, so there’s no figure to plan for.',
          consequence: 'Add it to your plan so the money is there, rather than arriving as a surprise.',
        },
      ];
    }
    if (policy.status === 'UNKNOWN') {
      return [
        {
          policy,
          title: `${policy.name} has no renewal date`,
          because: 'So there’s no way to tell whether the cover is still live.',
          consequence: 'Add the date from the policy document and this page can warn you before it lapses.',
        },
      ];
    }
    return [];
  });

  return (
    <section>
      <SectionHeader trailing={cards.length > 0 ? `${cards.length} to look at` : undefined}>Needs a look</SectionHeader>
      {cards.length > 0 ? (
        <div className="flex flex-col gap-space-3">
          {cards.map((c) => (
            <Card
              key={c.policy.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(c.policy)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen(c.policy);
                }
              }}
              className="flex cursor-pointer items-start gap-space-3 transition-opacity hover:opacity-90"
              style={TINT_STYLE}
            >
              <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-body text-ink">{c.title}</p>
                <p className="num mt-space-1 text-caption text-attention">{c.because}</p>
                <p className="mt-space-1 text-caption text-ink-muted">{c.consequence}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-space-2 text-body text-ink-soft">
          <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
          Nothing needs a look.
        </p>
      )}
    </section>
  );
}

/**
 * "Cover" - the fifth Money register (ROADMAP 1.3, ADR-0016).
 *
 * <p>The other four answer "what do I have" and "what do I owe". This one answers the
 * third question: <em>what wouldn't I have to find if this happened?</em>
 *
 * <p>Deliberately not styled like an asset register. Cover is never money you have, so the
 * page carries no positive hue and its headline figure sits beside what it costs rather
 * than anywhere near net worth.
 */
export default function CoverPage() {
  const { data: page, isLoading, isError, refetch } = useGetInsurancePoliciesQuery();
  const { data: summary, isLoading: summaryLoading } = useGetInsuranceSummaryQuery();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<InsurancePolicyResponse | null>(null);

  const policies = page?.content ?? [];

  if (!isLoading && !isError && policies.length === 0) {
    return (
      <>
        <EmptyState
          icon={ShieldCheck}
          headline="No cover recorded yet."
          body="Health, life, motor, home — what you're covered for, what it costs, and when it renews. Cover isn't money you have, so it never counts towards net worth; it's what you wouldn't have to find yourself."
          action={
            <Button variant="secondary" onClick={() => setAdding(true)}>
              <Plus size={16} strokeWidth={1.5} />
              Add cover
            </Button>
          }
        />
        <PolicySheet open={adding} onClose={() => setAdding(false)} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-space-8">
      <div className="flex items-start justify-between gap-space-4">
        <div className="flex flex-col gap-space-1">
          <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Cover</span>
          <span className="text-title text-ink">What you wouldn’t have to find</span>
          <span className="text-caption text-ink-muted">
            {policies.length} {policies.length === 1 ? 'policy' : 'policies'}
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          <Plus size={14} strokeWidth={1.5} />
          Add cover
        </Button>
      </div>

      {isError ? (
        <ErrorState message="We couldn't load your cover. Check your connection and try again." onRetry={refetch} />
      ) : (
        <>
          <section aria-label="What you're covered for" className="rounded-xl border border-line p-space-6">
            <CoverStanding summary={summary} isLoading={summaryLoading} />
          </section>

          <Divided>
            {isLoading ? <Skeleton className="h-16 w-full rounded-xl" /> : <CoverNeedsALook policies={policies} onOpen={setEditing} />}
          </Divided>

          <Divided>
            <section>
              <SectionHeader trailing={`${policies.length} ${policies.length === 1 ? 'policy' : 'policies'}`}>
                Your policies
              </SectionHeader>
              {isLoading ? (
                <div className="flex flex-col gap-space-2">
                  {[0, 1].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col">
                  {policies.map((policy) => (
                    <PolicyRow key={policy.id} policy={policy} onOpen={() => setEditing(policy)} />
                  ))}
                </div>
              )}
            </section>
          </Divided>
        </>
      )}

      <PolicySheet open={adding} onClose={() => setAdding(false)} />
      <PolicySheet open={editing != null} policy={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
