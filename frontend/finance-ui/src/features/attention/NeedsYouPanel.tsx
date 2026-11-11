import { useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { AnimatedCollapse } from '@/components/AnimatedCollapse';
import { Drawer } from '@/components/Drawer';
import { ErrorState } from '@/components/ErrorState';
import { InsightRow } from '@/components/InsightList';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { WhatChanged } from '@/features/today/components/WhatChanged';
import { useNeedsPanel } from '@/lib/needsPanel';
import { cn } from '@/lib/cn';
import {
  useDismissInsightMutation,
  useGetAllInsightsQuery,
  useRestoreInsightMutation,
} from '@/services/insightService';
import type { InsightItem, InsightSeverity } from '@/types/insight';

/** How often the open panel re-asks. Only while it is open and the tab is focused - a closed
 *  panel polls nothing, and the nav badge reads the same cache on its own refetch. */
const POLL_MS = 30_000;

/**
 * Severity is the ranking the server already applies, so these are only labels for the groups
 * it produces - the order is never re-decided here.
 */
const BANDS: { severity: InsightSeverity[]; title: string; note: string }[] = [
  { severity: ['CRITICAL'], title: 'Costs money if nothing happens', note: 'A late fee, a bounce, or interest that starts running.' },
  { severity: ['ATTENTION'], title: 'Needs a decision', note: 'Nothing is lost yet, but these will not resolve themselves.' },
  { severity: ['OPPORTUNITY', 'INFO'], title: 'Worth knowing', note: 'No hurry. Here when you want it.' },
];

/**
 * Everything that needs the user, in a panel over whatever page they are on
 * (UI_UX_REVAMP_PLAN 4.2). It was a page of its own; that sent people away from the figure the
 * item was about. Mounted once in the shell, driven by `?needs=1`.
 */
export function NeedsYouPanel() {
  const { isOpen, hide } = useNeedsPanel();
  return (
    <Drawer open={isOpen} onClose={hide} title="Needs you">
      <NeedsYouContent />
    </Drawer>
  );
}

/** Mounted only while the panel is open (the Drawer unmounts closed content), so its polling
 *  and fetching stop with it. */
function NeedsYouContent() {
  const { data, isLoading, isError, refetch } = useGetAllInsightsQuery(undefined, {
    pollingInterval: POLL_MS,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: true,
  });
  const [dismiss] = useDismissInsightMutation();
  const [restore] = useRestoreInsightMutation();
  const [showSilenced, setShowSilenced] = useState(false);

  const items: InsightItem[] = data?.items ?? [];
  const silenced = data?.silenced ?? [];
  const bands = BANDS.map((band) => ({ ...band, items: items.filter((i) => band.severity.includes(i.severity)) })).filter(
    (band) => band.items.length > 0,
  );

  return (
    <div className="flex flex-col gap-space-6">
      <p className="text-caption text-ink-muted" aria-live="polite">
        {isLoading ? 'Checking…' : `${items.length} ${items.length === 1 ? 'thing' : 'things'} · updates on its own`}
      </p>

      {isError ? (
        // Never claim "nothing needs you" when the truth is that we could not look.
        <ErrorState message="We couldn’t check what needs you. Check your connection and try again." onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-space-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col gap-space-2">
          <p className="flex items-center gap-space-2 text-body text-ink-soft">
            <CheckCircle2 size={16} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
            Nothing needs you right now.
          </p>
          <p className="pl-[24px] text-caption text-ink-muted">
            Every bill has an amount, nothing is overdue, and no account is heading below zero.
          </p>
        </div>
      ) : (
        bands.map((band) => (
          <section key={band.title}>
            <SectionHeader trailing={`${band.items.length}`}>{band.title}</SectionHeader>
            <p className="mb-space-3 text-caption text-ink-muted">{band.note}</p>
            <div className="flex flex-col gap-space-3">
              {band.items.map((item) => (
                <InsightRow key={item.key} item={item} navigable onDismiss={(key) => dismiss(key)} />
              ))}
            </div>
          </section>
        ))
      )}

      <WhatChanged />

      {/* Answered, not lost. A list you can silently drop things from is one you stop trusting,
          and an accidental "I know" would otherwise have no way back. */}
      {silenced.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowSilenced((v) => !v)}
            aria-expanded={showSilenced}
            className="inline-flex items-center gap-space-1 rounded-md px-space-1 text-caption text-ink-muted transition-colors duration-150 hover:text-ink"
          >
            {silenced.length} you’ve answered
            <ChevronDown
              size={13}
              strokeWidth={1.5}
              aria-hidden
              className={cn('transition-transform duration-[180ms]', showSilenced && 'rotate-180')}
            />
          </button>
          <AnimatedCollapse open={showSilenced}>
            <ul className="mt-space-3 flex flex-col gap-space-2 border-t border-line pt-space-3">
              {silenced.map((s) => (
                <li key={s.key} className="flex items-baseline justify-between gap-space-4">
                  <span className="min-w-0 truncate text-caption text-ink-muted">
                    {s.title}
                    {s.snoozedUntil && ' · back soon'}
                  </span>
                  <button
                    type="button"
                    onClick={() => restore(s.key)}
                    className="shrink-0 rounded-md px-space-1 text-caption text-accent underline-offset-2 transition-colors duration-150 hover:underline"
                  >
                    Show it again
                  </button>
                </li>
              ))}
            </ul>
          </AnimatedCollapse>
        </section>
      )}
    </div>
  );
}
