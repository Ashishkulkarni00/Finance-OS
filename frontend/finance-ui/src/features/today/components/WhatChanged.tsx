import { CheckCircle2 } from 'lucide-react';
import { SectionHeader } from '@/components/SectionHeader';
import { formatShortDate } from '@/lib/dates';
import { useAcknowledgeInsightChangeMutation, useGetInsightChangesQuery } from '@/services/insightService';

/**
 * "What changed" — warnings that resolved since you last acknowledged them (ROADMAP 3.4).
 *
 * <p>The toast says a recovery once, for ten seconds, at the moment of a write. Whoever was
 * not looking never learned that the bill they were worried about got covered. This is
 * where it waits for them.
 *
 * <p>Renders nothing when there is nothing — an empty "What changed" box is furniture. A
 * resolution that has since come back is marked as such and not coloured as good news:
 * calling it fixed when it is live again would be the product contradicting itself.
 */
export function WhatChanged() {
  const { data } = useGetInsightChangesQuery();
  const [acknowledge, { isLoading }] = useAcknowledgeInsightChangeMutation();
  if (!data || data.length === 0) return null;

  return (
    <section>
      <SectionHeader trailing={`${data.length}`}>What changed</SectionHeader>
      <p className="mb-space-3 text-caption text-ink-muted">Things that stopped needing you since you last looked.</p>
      <ul className="flex flex-col">
        {data.map((c) => (
          <li key={c.id} className="flex items-baseline justify-between gap-space-3 border-b border-line py-space-2 last:border-b-0">
            <span className="flex min-w-0 items-baseline gap-space-2">
              <CheckCircle2
                size={14}
                strokeWidth={1.5}
                className={c.liveAgain ? 'shrink-0 text-ink-muted' : 'shrink-0 text-positive'}
                aria-hidden
              />
              <span className="min-w-0 text-label text-ink">
                No longer: {c.title}
                <span className="block text-caption text-ink-muted">
                  Cleared {formatShortDate(new Date(c.clearedAt).toLocaleDateString('en-CA'))}
                  {c.occurrences > 1 && ` · came and went ${c.occurrences} times this month`}
                  {c.liveAgain && ' · it’s back now — see above'}
                </span>
              </span>
            </span>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => acknowledge(c.id)}
              className="shrink-0 text-caption text-accent underline-offset-4 hover:underline disabled:opacity-50"
            >
              Got it
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
