import { Amount } from '@/components/Amount';
import { SectionHeader } from '@/components/SectionHeader';
import { cn } from '@/lib/cn';
import { useGetRecoveryQuery } from '@/services/recoveryService';
import type { RecoveryStep } from '@/types/recovery';

const STEP_VERB: Record<RecoveryStep['kind'], string> = {
  DEFER: 'Let it wait',
  RELEASE: 'Borrow back from',
  SPEND_LESS: 'Spend a little less',
};

/**
 * The way back — ROADMAP 6.2. On a month that has gone wrong, not a red number but a short
 * list of levers in a sensible order, and how it gets put right afterwards.
 *
 * <p><strong>Silent when the month is fine</strong>, and calm when it is merely stretched:
 * a panel that appears every month stops being read by the third. Amber is kept for BROKEN —
 * bills that exceed what is held — the one case where doing nothing has a real cost.
 *
 * <p>Levers, not instructions. Nothing here moves money or skips a bill; the reader decides,
 * and the wording says "could", never "should" (rule 8).
 */
export function WayBack() {
  const { data } = useGetRecoveryQuery();
  if (!data || data.state === 'ON_COURSE' || data.state === 'INCOMPLETE' || data.steps.length === 0) return null;
  const broken = data.state === 'BROKEN';

  return (
    <section>
      <SectionHeader>{broken ? 'A way back this month' : 'Running tighter than usual'}</SectionHeader>
      <p className={cn('mb-space-3 text-caption', broken ? 'text-attention' : 'text-ink-soft')}>{data.reason}</p>
      <ol className="flex flex-col">
        {data.steps.map((s, i) => (
          <li key={`${s.kind}-${s.refId ?? i}`} className="flex items-baseline justify-between gap-space-3 border-b border-line py-space-2 last:border-b-0">
            <span className="min-w-0 text-label text-ink">
              <span className="block text-micro uppercase tracking-[0.08em] text-ink-muted">
                {data.steps.length > 1 ? `${i + 1}. ` : ''}{s.kind === 'SPEND_LESS' && i > 0 ? 'The rest' : STEP_VERB[s.kind]}
              </span>
              {s.kind === 'SPEND_LESS' && s.perDayLess ? (
                <>
                  About <Amount value={s.perDayLess} role="caption" className="text-ink" /> a day under usual until salary
                </>
              ) : (
                s.label
              )}
            </span>
            <Amount value={s.amount} role="row" className="shrink-0 text-ink" />
          </li>
        ))}
      </ol>
      {data.catchUp && Number(data.catchUp) > 0 && (
        <p className="mt-space-3 text-caption text-ink-muted">
          {data.catchUpMonths != null && data.catchUpPerMonth ? (
            <>
              Putting back <Amount value={data.catchUp} role="caption" className="text-ink" /> afterwards takes{' '}
              {data.catchUpMonths === 1 ? 'next month' : `${data.catchUpMonths} months`} at{' '}
              <Amount value={data.catchUpPerMonth} role="caption" className="text-ink" /> a month, still leaving your usual
              day-to-day spending.
            </>
          ) : (
            <>
              <Amount value={data.catchUp} role="caption" className="text-ink" /> would need putting back afterwards — the
              months ahead don’t leave room above usual spending for it yet.
            </>
          )}
        </p>
      )}
    </section>
  );
}
