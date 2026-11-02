import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { AnimatedCollapse } from '@/components/AnimatedCollapse';
import { BasisPanel } from './BasisPanel';
import { cn } from '@/lib/cn';
import { formatMoney, formatPercent } from '@/lib/money';
import { formatDayMonthYear } from '@/lib/dates';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import type { FinancialStateResponse, Provenance } from '@/types/financialState';

/**
 * **Standing** - the figures that are true today but are not about today.
 *
 * <p>These four used to be two thirds of Today's main block, in the same weight as the
 * day's own pacing. The result was that the heaviest, reddest number on a screen whose
 * question is *"can I spend?"* was a net worth of -₹2,02,316 - a figure that moves over
 * years, cannot be acted on this afternoon, and is already shown on both Money and
 * Summary. The user's words on 2026-11-01 were *"nothing is making sense for me right
 * now"*, and this block is most of why: four long-horizon figures shouting over one
 * short-horizon one.
 *
 * <p><strong>Folded away, not deleted.</strong> Deleting them would take "If income
 * stopped" out of the product entirely - it exists nowhere else - and would quietly remove
 * the worked derivations behind Owed and runway. Collapsed, they cost one line of the
 * page and are one click from being read in full, which is the right price for something
 * checked monthly rather than hourly.
 *
 * <p><strong>"Free this month" belongs here and not beside the hero.</strong> It is the
 * whole cycle's flexible money; Free until salary is what is left of the cycle. On this
 * user's real data they read ₹12,842 and ₹3,650 - two figures both labelled "free", five
 * rows apart, with nothing saying how they relate. Both are correct, which is precisely
 * why they cannot sit next to each other unexplained.
 *
 * <p>Nothing is computed here. Every figure arrives worked out from the server
 * (FRONTEND_CONVENTIONS §4 rule 2); this file groups, compares, words and formats.
 */
export function StandingPanel({ state }: { state: FinancialStateResponse }) {
  const [open, setOpen] = useState(false);
  // Which row is showing its working. One at a time: the panel is the answer to a question
  // the user just asked, not a mode the statement sits in.
  const [why, setWhy] = useState<'runway' | 'debt' | null>(null);

  const { shape, netWorth, runway, debt, baseline } = state;

  const freeThisMonthDoc = useDocAnchor('today.free-this-month');
  const netWorthRowDoc = useDocAnchor('today.net-worth-row');

  return (
    <section className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="pressable flex w-full items-center justify-between gap-space-4 border-t border-ink pt-space-3 text-left"
      >
        <span className="text-micro uppercase tracking-[0.08em] text-ink">Standing</span>
        <span className="flex items-center gap-space-2 text-caption text-ink-muted">
          {/* Named rather than left as "show more": a closed section that does not say what
              is in it is a section nobody opens. */}
          {open ? 'Hide' : 'This month, safety, what you owe'}
          <ChevronDown
            size={13}
            strokeWidth={1.75}
            aria-hidden
            className={cn('transition-transform duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)]', open && 'rotate-180')}
          />
        </span>
      </button>

      <AnimatedCollapse open={open}>
        <div className="grid w-full pt-space-2" style={{ gridTemplateColumns: '1fr auto' }}>
          <MetricRow
            label={<span {...freeThisMonthDoc}>Free this month</span>}
            value={shape.flexible}
            /* Amber when it is short, plain ink when it is not. Not red: red is where Net
               worth sits, and that one is negative every month for years on this user's
               data. If both carried it, the chronic figure would teach the eye to skip the
               colour, and the acute one is the only one of the two that can be acted on
               this month. Not green when positive either, though it was asked for: a row
               that is always coloured says nothing by being coloured. */
            valueClassName={shape.flexible != null && Number(shape.flexible) < 0 ? 'text-attention' : undefined}
            note={
              shape.flexible == null
                ? `${shape.unknownAmountCount} ${shape.unknownAmountCount === 1 ? 'bill has' : 'bills have'} no amount yet.`
                : Number(shape.committed) === 0 && Number(shape.plannedSavings) === 0
                  ? 'Nothing planned this month.'
                  : // The whole cycle, which is why it is bigger than Free until salary. Said
                    // in words on the row, because the two figures being different is the
                    // single most confusing thing this screen has ever shown.
                    `The whole cycle, not just what is left of it: ${formatMoney(shape.expectedIn)} in · ${formatMoney(shape.committed)} committed · ${formatMoney(shape.plannedSavings)} set aside.`
            }
          />

          {baseline.perCycle != null && (
            <MetricRow
              label="You usually spend"
              value={baseline.perCycle}
              note={
                baseline.lowest != null && baseline.highest != null
                  ? `A month, day to day, over ${baseline.cyclesObserved} closed ${baseline.cyclesObserved === 1 ? 'cycle' : 'cycles'} — between ${formatMoney(baseline.lowest)} and ${formatMoney(baseline.highest)}.`
                  : `A month, day to day, over ${baseline.cyclesObserved} closed ${baseline.cyclesObserved === 1 ? 'cycle' : 'cycles'}.`
              }
            />
          )}

          <MetricRow
            label={
              <WhyLabel
                text="If income stopped"
                docKey="today.runway"
                open={why === 'runway'}
                onClick={() => setWhy(why === 'runway' ? null : 'runway')}
              />
            }
            /* A badge, not a meter. A meter implies a scale with a maximum and runway has
               no natural one - two months and twenty months are both just numbers on an
               open axis. A bordered pill is an object *in* the row, which is the pattern
               that worked when three attempts at tinting rows did not (2026-09-30). */
            valueNode={
              runway.months == null ? (
                <span className="text-row text-ink-muted">—</span>
              ) : (
                <span className="inline-flex items-baseline gap-[0.35em]">
                  {runway.upperBound && <span className="text-caption text-ink-muted">at most</span>}
                  <span className="inline-flex items-baseline gap-[0.3em] rounded-full border border-border px-space-2 py-[0.1rem]">
                    <span className="num text-row text-ink">{runway.months}</span>
                    <span className="text-caption text-ink-muted">{runway.months === 1 ? 'month' : 'months'}</span>
                  </span>
                </span>
              )
            }
            note={
              runway.months == null
                ? runway.unknownReason
                : `${formatMoney(runway.liquidTotal)} reachable · ${formatMoney(runway.monthlyEssentials)} must-pay a month · day-to-day on top${
                    runway.unknownBillCount > 0 ? ` · ${runway.unknownBillCount} unpriced` : ''
                  }`
            }
          />
          <Basis open={why === 'runway'} basis={runway.basis} />

          <MetricRow
            label={
              <WhyLabel
                text="Owed"
                docKey="today.owed"
                open={why === 'debt'}
                onClick={() => setWhy(why === 'debt' ? null : 'debt')}
              />
            }
            value={debt.totalOutstanding}
            note={
              <>
                {debt.emiShareOfIncome != null && `${formatPercent(debt.emiShareOfIncome)} of income to EMIs`}
                {debt.emiShareOfIncome != null && debt.debtFreeDate && ' · '}
                {/* formatDayMonthYear, not formatSalaryDate: that one takes a cycle *end*
                    and adds a day to find payday, and it drops the year - on a date three
                    years out the year is the whole point. */}
                {debt.debtFreeDate && `clear ${formatDayMonthYear(debt.debtFreeDate)}`}
                {debt.loansWithoutTerms > 0 && ` · ${debt.loansWithoutTerms} without terms`}
              </>
            }
          />
          <Basis open={why === 'debt'} basis={debt.basis} />

          <MetricRow
            variant="footer"
            label={<span {...netWorthRowDoc}>Net worth</span>}
            value={netWorth.netWorth}
            emphasiseNegative
            note={`${formatMoney(netWorth.totalAssets)} held · ${formatMoney(netWorth.totalLiabilities)} owed`}
          />
        </div>
      </AnimatedCollapse>
    </section>
  );
}

/**
 * One figure, its label, and the words that produced it.
 *
 * <p>`display: contents`, so the parent grid governs the columns - that is what makes
 * digits stack down the block. The cells carry the rules, because a row with no box of its
 * own cannot hold a border.
 *
 * <p>The annotation sits *under* its label rather than in a third column beside the
 * figure, which is what used to make this block read as prose with numbers in it. Below
 * the label it is subordinate by position rather than only by colour, and the figure
 * column becomes the rightmost thing on the row - so scanning down the numbers no longer
 * crosses a paragraph on every line.
 */
function MetricRow({
  label,
  value,
  valueNode,
  valueClassName,
  note,
  emphasiseNegative,
  variant = 'row',
}: {
  label: ReactNode;
  value?: string | null;
  valueNode?: ReactNode;
  /** Conditional tone for the figure. A colour, never a verdict (DESIGN_SYSTEM §12 rule 8). */
  valueClassName?: string;
  note?: ReactNode;
  emphasiseNegative?: boolean;
  variant?: 'row' | 'footer';
}) {
  const cell = variant === 'footer' ? 'border-t border-border pt-space-3 pb-space-1' : 'border-b border-line py-space-3';

  return (
    <div className="contents">
      <div className={cn(cell, 'min-w-0 pr-space-5')}>
        <span
          className={cn(
            'block',
            variant === 'footer' ? 'text-label font-semibold text-ink' : 'text-label text-ink-soft',
          )}
        >
          {label}
        </span>
        {note !== undefined && note !== null && (
          <span className="mt-[0.15rem] block text-caption text-ink-muted">{note}</span>
        )}
      </div>

      <div className={cn(cell, 'text-right tabular-nums')}>
        {valueNode ?? <Amount value={value} role="row" emphasiseNegative={emphasiseNegative} className={valueClassName} />}
      </div>
    </div>
  );
}

/** A derivation belongs under its row and across both columns. */
function Basis({ open, basis }: { open: boolean; basis?: Provenance }) {
  if (!open || !basis) return null;
  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <BasisPanel basis={basis} />
    </div>
  );
}

/** A label that offers its own derivation. Underlined on hover only - a statement peppered
 *  with permanent links reads as a web page, not a ledger. */
function WhyLabel({
  text,
  open,
  onClick,
  docKey,
}: {
  text: string;
  open: boolean;
  onClick: () => void;
  /** A `data-doc` key for this row, so right-clicking the label opens what it means -
   *  distinct from clicking it, which opens the worked breakdown itself. */
  docKey?: string;
}) {
  const doc = useDocAnchor(docKey ?? '');
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      {...(docKey ? doc : {})}
      className="inline-flex items-center gap-space-1 text-left underline-offset-4 hover:underline"
    >
      {text}
      <ChevronDown
        size={12}
        strokeWidth={1.75}
        aria-hidden
        className={cn('shrink-0 text-ink-muted transition-transform duration-150', open && 'rotate-180')}
      />
    </button>
  );
}
