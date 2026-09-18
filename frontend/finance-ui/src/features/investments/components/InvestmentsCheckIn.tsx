import { CheckCircle2, Sparkles } from 'lucide-react';
import { SectionHeader } from '@/components/SectionHeader';
import type { InvestmentResponse } from '@/types/investment';

/** Beyond this, a valuation is old enough that "what it's worth" overstates what we know -
 *  one quarter's statement. Kept in step with InvestmentRow's own threshold. */
const STALE_AFTER_DAYS = 92;

const WASH_STYLE = { backgroundColor: 'color-mix(in srgb, var(--invest) 6%, var(--surface))' } as const;

function Note({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-start gap-space-3 rounded-xl p-space-4" style={WASH_STYLE}>
      <Sparkles size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-invest" aria-hidden />
      <div className="min-w-0">
        <p className="text-label text-ink">{title}</p>
        <p className="mt-space-1 text-caption text-ink-muted">{detail}</p>
      </div>
    </div>
  );
}

/**
 * "Keep it accurate" - Investments' counterpart to Needs a look, in a different voice.
 *
 * <p>Every other screen's attention zone is amber, because what it lists can cost money:
 * a bill overdue, an account short. Nothing here can. An investment that hasn't been
 * valued isn't in trouble - its figures just aren't current - so this is set in the
 * invest hue with a calm icon, and phrased as the small bits of upkeep that make the
 * growth figures real rather than as warnings. Same structure as the other zones (always
 * present, a quiet line when empty), different register.
 *
 * <p>This is also where the note about never estimating a market value used to live, as a
 * paragraph under the list.
 */
export function InvestmentsCheckIn({ investments }: { investments: InvestmentResponse[] }) {
  const neverValued = investments.filter((i) => i.currentValue == null);
  const stale = investments.filter((i) => i.currentValue != null && (i.valuationAgeDays ?? 0) > STALE_AFTER_DAYS);
  const sourceUnknown = investments.filter((i) => i.monthlyContribution != null && !i.payFromAccount && !i.outsideLedger);

  const names = (list: InvestmentResponse[]) => list.map((i) => i.name).join(', ');
  const hasAny = neverValued.length > 0 || stale.length > 0 || sourceUnknown.length > 0;

  return (
    <section>
      <SectionHeader>Keep it accurate</SectionHeader>

      {hasAny ? (
        <div className="flex flex-col gap-space-3">
          {neverValued.length > 0 && (
            <Note
              title={
                neverValued.length === 1
                  ? `${neverValued[0]!.name} hasn’t been valued yet`
                  : `${neverValued.length} holdings haven’t been valued yet: ${names(neverValued)}`
              }
              detail="Tap Value on the row and enter what your latest statement says it’s worth. Nothing here estimates a market value for you — once a quarter is plenty."
            />
          )}
          {stale.length > 0 && (
            <Note
              title={`Worth a fresh value: ${names(stale)}`}
              detail="The last value is more than three months old, so the growth shown for it may be well off."
            />
          )}
          {sourceUnknown.length > 0 && (
            <Note
              title={`Where the monthly contribution comes from isn’t recorded: ${names(sourceUnknown)}`}
              detail="Record the account it leaves from, so the right account is known to be carrying it."
            />
          )}
        </div>
      ) : (
        <p className="flex items-center gap-space-2 text-body text-ink-soft">
          <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
          Everything’s up to date.
        </p>
      )}
    </section>
  );
}
