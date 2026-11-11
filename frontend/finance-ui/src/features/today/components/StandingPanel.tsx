import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { ScrollStrip } from '@/components/ScrollStrip';
import { SectionHeader } from '@/components/SectionHeader';
import { Sheet } from '@/components/Sheet';
import { BasisPanel } from './BasisPanel';
import { cn } from '@/lib/cn';
import { formatMoney, formatPercent } from '@/lib/money';
import { formatDayMonthYear } from '@/lib/dates';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import type { FinancialStateResponse } from '@/types/financialState';

/**
 * **Your standing** - the figures that are true today but are not about today.
 *
 * <p><strong>2026-11-11: tiles, not a folded list.</strong> It was a collapsed "Standing" row
 * that opened into a ruled statement; the user asked for "something else than the current way".
 * Now it is a row of small tiles - swiped sideways on a phone, five across on a wide screen -
 * always visible at the foot of Today, each one figure with one line under it. Two of them
 * (If income stopped, Owed) open their worked derivation in a sheet; the rest go to the page
 * that owns them (Summary, Month, Money).
 *
 * <p><strong>Still quiet, on purpose.</strong> On 2026-11-01 the heaviest, reddest number on
 * Today was a net worth that moves over years, and the user said "nothing is making sense".
 * So the tiles sit last, small, and in ink: net worth carries its minus sign but not red here
 * - Money is where it is read in full. Nothing is computed; every figure is the server's.
 *
 * <p><strong>"Flexible this month" says "whole cycle".</strong> It is the cycle's flexible money,
 * not Free until salary (what is left of it). Both are correct and differ, so the tile names
 * which one it is rather than sitting beside the hero as a second "free".
 */
export function StandingPanel({ state }: { state: FinancialStateResponse }) {
  const [why, setWhy] = useState<'runway' | 'debt' | null>(null);
  const { shape, netWorth, runway, debt, baseline } = state;
  const freeThisMonthDoc = useDocAnchor('today.free-this-month');
  const netWorthDoc = useDocAnchor('today.net-worth-row');
  const runwayDoc = useDocAnchor('today.runway');
  const owedDoc = useDocAnchor('today.owed');

  const flexibleNegative = shape.flexible != null && Number(shape.flexible) < 0;
  const basis = why === 'runway' ? runway.basis : why === 'debt' ? debt.basis : undefined;

  return (
    <section className="w-full">
      <SectionHeader overCard>Your standing</SectionHeader>

      <ScrollStrip className="-mx-space-4 flex snap-x snap-mandatory scroll-px-space-4 gap-space-3 px-space-4 pb-space-1 md:mx-0 md:grid md:grid-cols-5 md:px-0">
        <Tile
          doc={runwayDoc}
          label="If income stopped"
          onClick={runway.basis ? () => setWhy('runway') : undefined}
          value={
            runway.months == null ? (
              <span className="text-ink-muted">—</span>
            ) : (
              <span className="inline-flex items-baseline gap-[0.25em]">
                {runway.upperBound && <span className="text-caption font-normal text-ink-muted">up to</span>}
                <span className="num">{runway.months}</span>
                <span className="text-label font-normal text-ink-muted">{runway.months === 1 ? 'month' : 'months'}</span>
              </span>
            )
          }
          sub={runway.months == null ? runway.unknownReason ?? 'not known yet' : `${formatMoney(runway.liquidTotal)} you could reach`}
        />

        <Tile
          doc={owedDoc}
          label="Owed"
          onClick={debt.basis ? () => setWhy('debt') : undefined}
          value={<Amount value={debt.totalOutstanding} role="section" className="text-ink" />}
          sub={
            debt.debtFreeDate
              ? `clear by ${formatDayMonthYear(debt.debtFreeDate)}`
              : debt.emiShareOfIncome != null
                ? `${formatPercent(debt.emiShareOfIncome)} of income to EMIs`
                : 'no end date yet'
          }
        />

        {baseline.perCycle != null && (
          <Tile
            label="Usual month"
            to="/summary"
            value={<Amount value={baseline.perCycle} role="section" className="text-ink" />}
            sub={
              baseline.lowest != null && baseline.highest != null
                ? `day to day · ${formatMoney(baseline.lowest)}–${formatMoney(baseline.highest)}`
                : `day to day, over ${baseline.cyclesObserved} months`
            }
          />
        )}

        <Tile
          doc={freeThisMonthDoc}
          label="Flexible this month"
          to="/month"
          value={<Amount value={shape.flexible} role="section" className={flexibleNegative ? 'text-attention' : 'text-ink'} />}
          sub="whole cycle, not what's left"
        />

        <Tile
          doc={netWorthDoc}
          label="Net worth"
          to="/money/accounts"
          value={<Amount value={netWorth.netWorth} role="section" className="text-ink" />}
          sub={`${formatMoney(netWorth.totalAssets)} held · ${formatMoney(netWorth.totalLiabilities)} owed`}
        />
      </ScrollStrip>

      <Sheet
        open={why != null && basis != null}
        onClose={() => setWhy(null)}
        title={why === 'runway' ? 'If income stopped' : 'What you owe'}
        size="narrow"
        guardDirty={false}
      >
        {basis && <BasisPanel basis={basis} />}
      </Sheet>
    </section>
  );
}

/**
 * One standing figure. A button when it opens its working here, a link when another page owns
 * it - and a quiet chevron says which tiles go somewhere. `snap-start` so a swipe lands on a
 * tile's edge rather than half-way through one.
 */
function Tile({
  label,
  value,
  sub,
  onClick,
  to,
  doc,
}: {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  onClick?: () => void;
  to?: string;
  doc?: Record<string, string>;
}) {
  const className = cn(
    'pressable group flex w-[10.5rem] shrink-0 snap-start flex-col rounded-2xl border border-line bg-surface p-space-3 text-left transition-colors duration-150 md:w-auto',
    (onClick || to) && 'hover:border-ink-muted',
  );
  const body = (
    <>
      <span className="flex items-center justify-between gap-space-2">
        <span className="truncate text-caption text-ink-muted">{label}</span>
        {(onClick || to) && <ChevronRight size={14} strokeWidth={1.5} aria-hidden className="shrink-0 text-ink-muted" />}
      </span>
      <span className="mt-space-2 truncate text-section font-medium text-ink">{value}</span>
      <span className="mt-space-1 line-clamp-2 text-caption text-ink-muted">{sub}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={className} {...doc}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} {...doc}>
        {body}
      </button>
    );
  }
  return (
    <div className={className} {...doc}>
      {body}
    </div>
  );
}
