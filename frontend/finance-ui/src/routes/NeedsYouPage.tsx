import { useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { AnimatedCollapse } from '@/components/AnimatedCollapse';
import { cn } from '@/lib/cn';
import { ErrorState } from '@/components/ErrorState';
import { InsightRow } from '@/components/InsightList';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import {
  useDismissInsightMutation,
  useGetAllInsightsQuery,
  useRestoreInsightMutation,
} from '@/services/insightService';
import type { InsightItem, InsightSeverity } from '@/types/insight';

/** How often the page re-asks. Long enough not to hammer a single-user backend, short
 *  enough that a list someone leaves open is not quietly describing ten minutes ago. */
const POLL_MS = 30_000;

/**
 * Severity is the ranking the server already applies, so these are only labels for the
 * groups it produces - the order is never re-decided here.
 */
const BANDS: { severity: InsightSeverity[]; title: string; note: string }[] = [
  {
    severity: ['CRITICAL'],
    title: 'Costs money if nothing happens',
    note: 'A late fee, a bounce, or interest that starts running.',
  },
  {
    severity: ['ATTENTION'],
    title: 'Needs a decision',
    note: 'Nothing is lost yet, but these will not resolve themselves.',
  },
  { severity: ['OPPORTUNITY', 'INFO'], title: 'Worth knowing', note: 'No hurry. Here when you want it.' },
];

/**
 * Everything that needs the user, in one place.
 *
 * <p>Today and Months each show a short list and say "3 of 7 shown" - which was true, and
 * went nowhere. This is where the rest lives, and it is the only surface where a row itself
 * is a way in: reading the whole list *is* the job here, so a tap should open the thing.
 *
 * <p>Deliberately not a sixth navigation tab. Today's entire purpose is "where do I stand
 * right now", and a sibling tab would split one job across two screens. This is a
 * drill-down of Today's own "Needs you" block, and the rail keeps Today lit while you are
 * here.
 */
export function NeedsYouPage() {
  const { data, isLoading, isError, refetch } = useGetAllInsightsQuery(undefined, {
    pollingInterval: POLL_MS,
    refetchOnMountOrArgChange: true,
  });

  const [dismiss] = useDismissInsightMutation();
  const [restore] = useRestoreInsightMutation();
  const [showSilenced, setShowSilenced] = useState(false);

  const items: InsightItem[] = data?.items ?? [];
  const silenced = data?.silenced ?? [];
  const bands = BANDS.map((band) => ({
    ...band,
    items: items.filter((i) => band.severity.includes(i.severity)),
  })).filter((band) => band.items.length > 0);

  return (
    <div className="flex flex-col gap-space-8">
      <div className="flex flex-col gap-space-1">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Needs you</span>
        <span className="text-title text-ink">Everything waiting on a decision</span>
        <span className="text-caption text-ink-muted">
          {isLoading ? 'Checking…' : `${items.length} ${items.length === 1 ? 'thing' : 'things'} · updates on its own`}
        </span>
      </div>

      {isError ? (
        // Never claim "nothing needs you" when the truth is that we could not look.
        <ErrorState message="We couldn't check what needs you. Check your connection and try again." onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-space-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col gap-space-2">
          <p className="flex items-center gap-space-2 text-body text-ink-soft">
            <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
            Nothing needs you right now.
          </p>
          <p className="pl-[26px] text-caption text-ink-muted">
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

      {/* Answered, not lost. Folded away rather than deleted: a list you can silently drop
          things from is one you stop trusting, and an accidental "I know" would otherwise
          have no way back. Same disclosure pattern as "1 stopped" on Months. */}
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
              strokeWidth={1.75}
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

export default NeedsYouPage;
