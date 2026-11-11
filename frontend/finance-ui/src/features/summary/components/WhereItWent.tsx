import { useState } from 'react';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/lib/cn';
import { cycleMonthName } from '@/lib/dates';
import { formatMoney, formatPercent } from '@/lib/money';
import { useGetReviewMonthCategoriesQuery } from '@/services/reviewService';
import type { ReviewMonth } from '@/types/review';
import { CategoryBars } from './CategoryBars';
import { SplitBar } from './SplitBar';
import { FiguresToggle, Legend, SERIES } from './viz';

/** Categories shown as bars before the rest fold into "Everything else". */
const TOP = 8;

/**
 * Where one month's money went - the month's whole first, then its parts.
 *
 * <ul>
 *   <li><strong>A tall segmented bar</strong>: committed · day-to-day · invested. One whole,
 *       three parts, read at a glance - what a pie is usually asked to do, done on one
 *       baseline-free bar whose parts can be compared by length.</li>
 *   <li><strong>Ranked category bars</strong>, largest first, each split into the part that
 *       paid a planned bill and the part that was day-to-day. Bars, not a pie, because the
 *       reader's job here is to compare categories with each other, and a dozen pie slices
 *       can't be compared.</li>
 * </ul>
 * A chip per recorded month picks which month; the newest is shown first.
 */
export function WhereItWent({ months }: { months: ReviewMonth[] }) {
  const recorded = months.filter((m) => m.recorded && m.planTracked);
  const [picked, setPicked] = useState<number | null>(null);
  const month = recorded.find((m) => m.cycleId === picked) ?? recorded[recorded.length - 1];
  const { data, isLoading } = useGetReviewMonthCategoriesQuery(month?.cycleId ?? 0, { skip: !month });

  if (!month) return null;

  const parts = [
    // Ink inside a fill goes by the fill's luminance: white on the blue, near-black on the
    // lighter orange and aqua (white there falls under 3.5:1).
    { key: 'committed', label: 'Committed — bills & EMIs', value: month.committed, colour: SERIES.committed, ink: '#ffffff' },
    { key: 'flexible', label: 'Day to day', value: month.flexible, colour: SERIES.flexible, ink: '#0b0b0b' },
    { key: 'invested', label: 'Invested', value: month.invested, colour: SERIES.invested, ink: '#0b0b0b' },
  ].filter((p) => p.value != null && Number(p.value) > 0);

  const cats = data?.categories ?? [];
  const shown = cats.slice(0, TOP);
  const rest = cats.slice(TOP);

  return (
    <section className="m-card flex flex-col gap-space-5 max-md:gap-space-4">
      <SectionHeader overCard trailing={month.current ? 'so far' : undefined}>Where does the money go?</SectionHeader>

      {recorded.length > 1 && (
        <div className="flex flex-wrap gap-space-2" role="radiogroup" aria-label="Which month">
          {[...recorded].reverse().map((m) => {
            const active = m.cycleId === month.cycleId;
            return (
              <button
                key={m.cycleId}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPicked(m.cycleId)}
                className={cn(
                  'rounded-full border px-space-3 py-space-1 text-caption transition-colors duration-150',
                  active ? 'border-ink-soft bg-sunken text-ink' : 'border-border text-ink-muted hover:text-ink-soft',
                )}
              >
                {cycleMonthName(m.endDate)}
                {m.current ? ' · so far' : ''}
              </button>
            );
          })}
        </div>
      )}

      {/* The whole: a tall segmented bar, each part's share printed on it where it fits. */}
      <div className="flex flex-col gap-space-2">
        <p className="text-body text-ink-soft">
          <span className="text-ink">{formatMoney(month.spend)}</span> went out in {cycleMonthName(month.endDate)}
          {month.committedShare != null && (
            <>
              {' '}
              — <span className="text-ink">{formatPercent(month.committedShare)}</span> of the income was already promised
              before a rupee of day-to-day.
            </>
          )}
        </p>
        <SplitBar title={`${cycleMonthName(month.endDate)}${month.current ? ' so far' : ''}`} parts={parts.map((p) => ({ key: p.key, label: p.label, value: p.value!, colour: p.colour, ink: p.ink }))} />
        <Legend items={parts.map((p) => ({ label: `${p.label} · ${formatMoney(p.value)}`, colour: p.colour }))} />
      </div>

      {/* The parts: ranked bars by category, committed vs day-to-day inside each. */}
      <div className="flex flex-col gap-space-2">
        <span className="text-caption text-ink-muted">By category</span>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <CategoryBars categories={shown} />
        )}
        {rest.length > 0 && (
          <p className="text-caption text-ink-muted">
            + {rest.length} more {rest.length === 1 ? 'category' : 'categories'}, each smaller — in the figures below.
          </p>
        )}
        <Legend
          items={[
            { label: 'Paid a planned bill', colour: SERIES.committed },
            { label: 'Day to day', colour: SERIES.flexible },
          ]}
        />
      </div>

      <FiguresToggle>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-caption text-ink-muted">
              <th className="py-space-2 font-normal">Category</th>
              <th className="py-space-2 text-right font-normal">Planned bills</th>
              <th className="py-space-2 text-right font-normal">Day to day</th>
              <th className="py-space-2 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.categoryId} className="border-b border-line last:border-b-0">
                <td className="py-space-2 text-label text-ink">{c.name}</td>
                <td className="num py-space-2 text-right text-caption text-ink-soft">{formatMoney(c.committed)}</td>
                <td className="num py-space-2 text-right text-caption text-ink-soft">{formatMoney(c.flexible)}</td>
                <td className="num py-space-2 text-right text-label text-ink">{formatMoney(c.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </FiguresToggle>
    </section>
  );
}
