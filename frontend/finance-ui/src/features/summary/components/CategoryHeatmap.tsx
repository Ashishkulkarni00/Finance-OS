import { useEffect, useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { cycleMonthName } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { reviewService } from '@/services/reviewService';
import { useAppDispatch } from '@/store/hooks';
import type { RootState } from '@/store';
import type { ReviewMonth, ReviewMonthCategories } from '@/types/review';
import { compactMoney, FiguresToggle } from './viz';

/** Rows shown; the rest of the categories stay in the figures. */
const ROWS = 10;
/** Sequential steps, lightest = near zero. Index 4+ is dark enough for white ink. */
const STEPS = ['var(--viz-seq-0)', 'var(--viz-seq-1)', 'var(--viz-seq-2)', 'var(--viz-seq-3)', 'var(--viz-seq-4)', 'var(--viz-seq-5)', 'var(--viz-seq-6)'];

/**
 * Category × month, shaded by how much went out - the one view that shows *what changed*
 * between months at a glance: a row that darkens is a category growing. One hue, light to
 * dark (sequential), because the job is magnitude, not identity.
 *
 * <p>Every cell prints its compact amount: with this few cells (a dozen rows by a handful
 * of months) the number is the point, and the shading is how the eye finds the big ones.
 * Exact figures are in each cell's tooltip and in the folded table.
 *
 * <p>Months are fetched through the store rather than one hook per month, so a month
 * appearing doesn't change the hook count.
 */
export function CategoryHeatmap({ months }: { months: ReviewMonth[] }) {
  const recorded = useMemo(() => months.filter((m) => m.recorded), [months]);
  const ids = recorded.map((m) => m.cycleId);
  const key = ids.join(',');
  const dispatch = useAppDispatch();

  useEffect(() => {
    const subs = ids.map((id) => dispatch(reviewService.endpoints.getReviewMonthCategories.initiate(id)));
    return () => subs.forEach((s) => s.unsubscribe());
    // `key` stands for `ids`: re-subscribe only when the set of months changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, dispatch]);

  const results = useSelector(
    (state: RootState) => ids.map((id) => reviewService.endpoints.getReviewMonthCategories.select(id)(state).data),
    shallowEqual,
  ) as (ReviewMonthCategories | undefined)[];

  if (recorded.length < 2) return null; // one column is a list, not a comparison
  if (results.some((r) => !r)) {
    return (
      <section className="flex flex-col gap-space-4">
        <SectionHeader>How each category moved</SectionHeader>
        <Skeleton className="h-64 w-full" />
      </section>
    );
  }

  // Rank categories by their largest month, so a one-off big month still earns a row.
  const byId = new Map<number, { name: string; cells: Map<number, string> }>();
  results.forEach((r, i) => {
    r!.categories.forEach((c) => {
      const row = byId.get(c.categoryId) ?? { name: c.name, cells: new Map<number, string>() };
      row.cells.set(ids[i]!, c.total);
      byId.set(c.categoryId, row);
    });
  });
  const rows = [...byId.entries()]
    .map(([id, r]) => ({ id, ...r, peak: Math.max(...[...r.cells.values()].map(Number)) }))
    .sort((a, b) => b.peak - a.peak);
  const shown = rows.slice(0, ROWS);
  const max = Math.max(1, ...shown.map((r) => r.peak));
  const step = (v: number) => (v <= 0 ? 0 : Math.min(STEPS.length - 1, 1 + Math.floor((v / max) * (STEPS.length - 1.001))));

  return (
    <section className="flex flex-col gap-space-4">
      <SectionHeader trailing={`top ${shown.length} categories`}>How each category moved</SectionHeader>
      <p className="max-w-[64ch] text-caption text-ink-muted">
        Darker is more. Read across a row to see a category grow or shrink from one month to the next.
      </p>

      <div className="overflow-x-auto">
        <div
          className="grid min-w-[28rem] gap-[2px]"
          style={{ gridTemplateColumns: `minmax(7rem,11rem) repeat(${recorded.length}, minmax(4.5rem,1fr))` }}
          role="table"
          aria-label="Spending by category and month"
        >
          <span role="columnheader" />
          {recorded.map((m) => (
            <span key={m.cycleId} role="columnheader" className="pb-space-1 text-center text-micro uppercase tracking-[0.08em] text-ink-muted">
              {cycleMonthName(m.endDate)}
              {m.current ? ' ·' : ''}
            </span>
          ))}
          {shown.map((r) => (
            <div key={r.id} role="row" className="contents">
              <span role="rowheader" className="truncate py-space-2 pr-space-2 text-label text-ink">
                {r.name}
              </span>
              {recorded.map((m) => {
                const raw = r.cells.get(m.cycleId);
                const v = raw ? Number(raw) : 0;
                const s = step(v);
                return (
                  <span
                    key={m.cycleId}
                    role="cell"
                    title={`${r.name}, ${cycleMonthName(m.endDate)}: ${raw ? formatMoney(raw) : 'nothing'}`}
                    className="num flex items-center justify-center rounded-[4px] py-space-2 text-caption"
                    style={{ background: STEPS[s], color: s >= 4 ? '#ffffff' : 'var(--ink)' }}
                  >
                    {v > 0 ? compactMoney(raw) : <span className="text-ink-muted">—</span>}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {recorded.some((m) => m.current) && (
        <p className="text-caption text-ink-muted">The last month is still running, so its row will fill in.</p>
      )}

      <FiguresToggle>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-micro uppercase tracking-[0.08em] text-ink-muted">
              <th className="py-space-2 font-normal">Category</th>
              {recorded.map((m) => (
                <th key={m.cycleId} className="py-space-2 text-right font-normal">
                  {cycleMonthName(m.endDate)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-b-0">
                <td className="py-space-2 text-label text-ink">{r.name}</td>
                {recorded.map((m) => (
                  <td key={m.cycleId} className="num py-space-2 text-right text-caption text-ink-soft">
                    {r.cells.get(m.cycleId) ? formatMoney(r.cells.get(m.cycleId)) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </FiguresToggle>
    </section>
  );
}
