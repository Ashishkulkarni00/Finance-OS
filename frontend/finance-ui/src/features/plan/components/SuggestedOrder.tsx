import { Check } from 'lucide-react';
import { Disclosure } from '@/components/Disclosure';
import { cn } from '@/lib/cn';
import { useGetSuggestedOrderQuery } from '@/services/goalService';

/**
 * A suggested order for spare money, with "you are here" — ROADMAP 5.3.
 *
 * <p>The map, not a verdict. Each step says why it sits where it does, so the order can be
 * disagreed with on its merits; nothing elsewhere in the product is blocked or reordered by
 * it. Done steps are ticked and quiet, the current one is the only one with weight, and the
 * rest are plain — a ladder with every rung shouting is just noise.
 */
export function SuggestedOrder() {
  const { data } = useGetSuggestedOrderQuery();
  if (!data || data.length === 0) return null;

  return (
    <Disclosure storageKey="kosh.goals.suggested-order" label="A common order for spare money" summary="the order most people find holds up">
      <p className="mb-space-3 max-w-[40rem] text-caption text-ink-muted">
        Not a rule — the order most people find holds up, with the reason for each step. Yours can differ.
      </p>
      <ol className="flex flex-col">
        {data.map((s, i) => (
          <li
            key={s.key}
            className={cn(
              'flex gap-space-3 border-b border-line py-space-2 last:border-b-0',
              s.current && 'rounded-md bg-sunken px-space-2',
            )}
          >
            <span
              className={cn(
                'num mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-micro',
                s.status === 'DONE' ? 'bg-positive/15 text-positive' : s.current ? 'bg-accent text-surface' : 'border border-line text-ink-muted',
              )}
              aria-hidden
            >
              {s.status === 'DONE' ? <Check size={12} strokeWidth={1.75} /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className={cn('block text-label', s.status === 'DONE' ? 'text-ink-muted' : 'text-ink')}>
                {s.title}
                {s.current && <span className="ml-space-2 text-caption text-accent">You are here</span>}
              </span>
              {s.detail && <span className="block text-caption text-ink-soft">{s.detail}</span>}
              {(s.current || s.status !== 'DONE') && <span className="block text-caption text-ink-muted">{s.why}</span>}
            </span>
          </li>
        ))}
      </ol>
    </Disclosure>
  );
}
