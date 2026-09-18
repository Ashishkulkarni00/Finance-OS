import { useNavigate } from 'react-router-dom';
import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { formatPercent } from '@/lib/money';
import { cycleProgress } from '@/lib/dates';
import { useGetFlexibleSpendingQuery } from '@/services/cycleService';
import type { CycleResponse } from '@/types/cycle';

interface FlexibleSpendingSectionProps {
  cycle: CycleResponse | undefined;
}

/**
 * Descending tints of one hue, largest category darkest. Categories have no inherent
 * colour, and borrowing the semantic palette would imply one - "Groceries" rendered in
 * the debt orange says something untrue. A ramp encodes only rank, which is all the
 * ordering actually means. DESIGN_SYSTEM §2 (colour carries meaning or nothing).
 */
const TINTS = [1, 0.82, 0.66, 0.52, 0.4, 0.3, 0.22];
const tint = (i: number) => TINTS[Math.min(i, TINTS.length - 1)];

/**
 * Zone 5 - day-to-day spending, and what it's made of.
 *
 * <p>This used to be a bare list of category totals, which left the obvious question
 * unanswered: what is this telling me? Three things were missing. The total itself -
 * six numbers you have to add up yourself is not a figure. What the category weights
 * are - "₹3,200" means nothing until you know it's over a third of everything. And what
 * "flexible" even means, which is our word, not the user's.
 *
 * <p>Each category row now opens the Ledger, pre-filtered to that category and this
 * cycle - the "justification loop" (LEDGER_EXPERIENCE.md §4): the figure asserted here
 * and the entries that make it up are one click apart, not two facts you have to trust
 * matched each other.
 *
 * <p>What it deliberately still does not do is judge. There is no budget line here and
 * no "you overspent" - the product's position (PRODUCT_STRATEGY §5) is that a spending
 * figure is compared against your own history or against nothing at all, and there
 * isn't enough history yet. Saying so is better than inventing a target.
 */
export function FlexibleSpendingSection({ cycle }: FlexibleSpendingSectionProps) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetFlexibleSpendingQuery(cycle?.id ?? 0, { skip: !cycle });
  const categories = data?.categories ?? [];
  const dayOfCycle = cycle ? cycleProgress(cycle.startDate, cycle.endDate).dayOfCycle : null;

  return (
    <section>
      {/* Renamed from "Flexible spending" - our word for a category group, not a question
          anyone asks. What this section answers is where the day-to-day money went. */}
      <SectionHeader trailing="groceries, eating out, transport…">Where day-to-day money went</SectionHeader>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : isError ? (
        // Per zone, not per page (MONTH_TAB_UX_SPEC §9) - and never "nothing yet" for a
        // request that failed.
        <p className="text-body text-ink-soft">We couldn’t load day-to-day spending. Refresh to try again.</p>
      ) : categories.length === 0 ? (
        <p className="text-caption text-ink-muted">
          Nothing on day-to-day categories yet this cycle - it'll show up here as you spend.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-space-4">
            <div>
              <Amount value={data?.total} role="section" className="text-ink" />
              <p className="mt-space-1 text-caption text-ink-muted">
                {/* Was "spent on everything that isn't a committed bill", which is not what
                    this sums: only FLEXIBLE-group categories. One-off and fixed-category
                    spending is in Money out above, not here. */}
                on day-to-day categories, part of Money out · tap a category to see its entries
                {dayOfCycle != null && ` · ${dayOfCycle} days in`}
              </p>
            </div>
          </div>

          {/* One bar, segmented by category. The rows below are its legend. */}
          <div className="mt-space-4 flex h-2 w-full gap-[2px] overflow-hidden rounded-full">
            {categories.map((c, i) => (
              <div
                key={c.categoryId}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(c.share ?? 0) * 100}%`, background: 'var(--accent)', opacity: tint(i) }}
              />
            ))}
          </div>

          <div className="mt-space-5 grid grid-cols-[auto_minmax(0,1fr)_3.5rem_8rem] items-center gap-x-space-3">
            {categories.map((c, i) => (
              // The rule runs through every cell, swatch included - a hairline that
              // stops short of the left edge reads as a mistake, not a margin. Each row
              // opens the Ledger pre-filtered to this category and cycle.
              <button
                key={c.categoryId}
                type="button"
                onClick={() => cycle && navigate(`/ledger?cycle=${cycle.id}&category=${c.categoryId}`)}
                className="col-span-4 grid grid-cols-subgrid items-center border-b border-line py-space-2 text-left transition-colors duration-150 hover:bg-sunken"
              >
                <span className="flex h-full items-center" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--accent)', opacity: tint(i) }} />
                </span>
                <span className="truncate text-row text-ink">{c.categoryName}</span>
                <span className="num text-right text-caption text-ink-muted">{formatPercent(c.share)}</span>
                <span className="text-right">
                  <Amount value={c.amount} role="row" className="text-ink" />
                </span>
              </button>
            ))}
          </div>

          {/* The "no budget on purpose" explanation moved to How Months works: said
              under every visit, it was reading as an apology for a missing feature. */}
        </>
      )}
    </section>
  );
}
