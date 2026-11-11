import { ArrowDownRight, ArrowUpRight, Minus, HelpCircle } from 'lucide-react';
import { SectionHeader } from '@/components/SectionHeader';
import { cn } from '@/lib/cn';
import { useGetMomentumQuery } from '@/services/momentumService';
import type { MomentumItem } from '@/types/momentum';

const ICON: Record<MomentumItem['direction'], typeof Minus> = {
  BETTER: ArrowUpRight,
  WORSE: ArrowDownRight,
  STEADY: Minus,
  UNKNOWN: HelpCircle,
};

/**
 * Momentum — ROADMAP 6.3. A few named directions, each with the facts behind it. No score,
 * no streak (both on the not-building list): a grade invites gaming and shame in equal
 * measure, and a direction with its reason invites a decision.
 *
 * <p>WORSE is ink, not red. It is a fact about a trend, not an alarm — alarms live on Today.
 */
export function Momentum() {
  const { data } = useGetMomentumQuery();
  if (!data || data.length === 0) return null;
  return (
    <section className="m-card">
      <SectionHeader overCard>Which way things are moving</SectionHeader>
      <ul className="flex flex-col">
        {data.map((m) => {
          const Icon = ICON[m.direction];
          return (
            <li key={m.key} className="flex gap-space-3 border-b border-line py-space-2 last:border-b-0 max-md:py-space-3 max-md:first:pt-0 max-md:last:pb-0">
              <Icon
                size={16}
                strokeWidth={1.5}
                aria-hidden
                className={cn('mt-[3px] shrink-0', m.direction === 'BETTER' ? 'text-positive' : 'text-ink-muted')}
              />
              <span className="min-w-0">
                <span className="block text-caption text-ink-muted">{m.name}</span>
                <span className="block text-label font-medium text-ink">{m.headline}</span>
                {m.reason && <span className="block text-caption text-ink-muted">{m.reason}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
