import { type CSSProperties, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Amount } from '@/components/Amount';
import { ProgressRule } from '@/components/ProgressRule';
import { BasisPanel } from './BasisPanel';
import { useAnimatedMoney } from '@/lib/useAnimatedMoney';
import { cn } from '@/lib/cn';
import { formatMoney, formatPercent, splitMoney } from '@/lib/money';
import { formatDayMonthYear } from '@/lib/dates';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import type { FinancialStateResponse } from '@/types/financialState';
import type { PositionResponse } from '@/types/position';
import type { Provenance } from '@/types/financialState';

/**
 * **The Pulse's seven figures, grouped into three tiers.**
 *
 * <p>Replaces the flat seven-row statement the Pulse used to render. The complaint that
 * produced this was *"visually flat, text-heavy, lacks clear hierarchy, and hides critical
 * financial health signals"*, and all four were true of the same cause: seven rows of
 * identical weight, each with a run-on annotation in a 22rem column to the **right** of the
 * figures. The numbers were aligned and nothing told you which of them mattered today.
 *
 * <p><strong>Three tiers, by how often you need them and what you can do about them:</strong>
 * pacing (many times a day, and you can change it this afternoon) · safety (weekly, and you
 * act on it over a month) · the balance sheet (rarely, and it moves over years). A subhead
 * names each one. Grouping is the whole fix: it is what lets the eye skip two thirds of the
 * block instead of reading all seven lines to find the one it came for.
 *
 * <p><strong>Still one grid, and that is deliberate.</strong> A card per tier was the first
 * proposal and was turned down twice, with the user's own reason: an earlier tile-based build
 * read as *less* classy than the spreadsheet it replaced, and `CLAUDE.md`'s bar is "aligned
 * figures, visible derivations, ruled density". Three separate grids would also give each
 * tier its own figure column, so the digits would stop stacking across the block - which is
 * the one property worth protecting here. So the subheads span both columns
 * (`gridColumn: 1 / -1`) and every figure in all three tiers shares one right-aligned
 * column.
 *
 * <p><strong>The annotation moved under its label.</strong> It used to sit in a third column
 * beside the figure, which is what made the block read as prose with numbers in it. Below the
 * label it is subordinate by position rather than only by colour, and the figure column
 * becomes the rightmost thing on the row - so scanning down the numbers no longer crosses a
 * paragraph on every line.
 *
 * <p><strong>Nothing is computed here.</strong> Every rupee arrives worked out from the
 * server (FRONTEND_CONVENTIONS §4 rule 2); this file groups, compares, words and formats.
 * The one ratio taken is the pacing bar's width - a proportion that sets a CSS length and is
 * never shown as money, the same allowance `PartPaidNote` already relies on.
 */
export function PulseMetrics({
  state,
  position,
  negative,
  why,
  onWhy,
}: {
  state: FinancialStateResponse;
  position: PositionResponse;
  /** Real Balance is below zero. Changes the words on the pacing rows, never hides them. */
  negative: boolean;
  /** Which row is showing its working. One at a time - the panel answers a question the
   *  user just asked, not a mode the block sits in. */
  why: 'runway' | 'debt' | null;
  onWhy: (next: 'runway' | 'debt' | null) => void;
}) {
  const { shape, netWorth, runway, debt, baseline } = state;

  const roomDoc = useDocAnchor('position.room');
  const freeThisMonthDoc = useDocAnchor('today.free-this-month');
  const netWorthRowDoc = useDocAnchor('today.net-worth-row');
  const needsYouCountDoc = useDocAnchor('today.needs-you-count');

  // Narrowed once here rather than guarded at every use: `PositionResponse` is a
  // discriminated union, so this is what makes every figure below non-null to the compiler
  // instead of needing an assertion per row.
  const ok = position.state === 'OK' ? position : null;

  // The one figure on this block that moves while the user is looking at it: recording an
  // expense changes it immediately. The rest shift on a scale of months, and a number that
  // eases on load is decoration rather than information (DESIGN_SYSTEM §10).
  const spentToday = useAnimatedMoney(ok?.spentToday ?? null);

  // A share can be zero or negative when more is committed than held - there is then no
  // benchmark to be a fraction of, and the rows below say so in words instead.
  const share = ok ? Number(ok.roomToday) : 0;
  const hasShare = share > 0;

  return (
    <div className="grid w-full" style={{ gridTemplateColumns: '1fr auto' }}>
      {/* ── Tier 1: pacing ─────────────────────────────────────────────────────────
          Rendered whenever the position is complete, including when Real Balance is
          negative. It used to be hidden in exactly that case, which removed the daily
          pace from the screen at the moment it matters most. What changes when negative
          is the *figure*, not the row: `perDay` goes negative there, and "−₹34.92 a day"
          is not a rate anyone can spend to, so it becomes a dash with a reason. */}
      {ok && (
        <>
          <GroupHead first>Today’s pace</GroupHead>

          <MetricRow
            label={<span {...roomDoc}>A day from here</span>}
            revealDelay={190}
            value={negative ? null : ok.perDay}
            note={
              negative
                ? 'Nothing to spread — more is committed before salary than you hold.'
                : `Spread evenly over the ${state.daysToSalary} ${state.daysToSalary === 1 ? 'day' : 'days'} to salary.`
            }
          />

          <MetricRow
            label="Spent today"
            revealDelay={245}
            value={spentToday}
            note={
              hasShare ? (
                <SpentTodayNote roomToday={ok.roomToday} roomLeft={ok.roomLeft} />
              ) : (
                'No share today — more is committed before salary than you hold.'
              )
            }
            /* The bar is the only instrument in this block, and it belongs to the one row
               that has a benchmark to be measured against. A ring was asked for and would
               have to lie: it cannot show past 100%, and spending more than a thirtieth of
               what is left on a given day is normal, not a failure (rule 8). A rule
               overshoots legibly - it pins at full and the note changes word to "over". */
            belowNote={
              hasShare ? (
                <ProgressRule fraction={Number(ok.spentToday) / share} className="mt-space-2 max-w-[18rem]" />
              ) : undefined
            }
          />
        </>
      )}

      {/* ── Tier 2: safety ──────────────────────────────────────────────────────── */}
      <GroupHead first={!ok}>Safety</GroupHead>

      <MetricRow
        label={<span {...freeThisMonthDoc}>Free this month</span>}
        revealDelay={300}
        value={shape.flexible}
        /* Amber when it is short, plain ink when it is not.
           Not red: red is where Net worth sits, and that one is negative every month for
           years on this user's data. If both carried it, the chronic figure would teach the
           eye to skip the colour, and the acute one is the only one of the two that can be
           acted on this month.
           Not green when positive either, though it was asked for: a row that is always
           coloured says nothing by being coloured. Neutral-when-fine is what makes amber
           mean something when it appears (DESIGN_SYSTEM §12 rule 9). */
        valueClassName={shape.flexible != null && Number(shape.flexible) < 0 ? 'text-attention' : undefined}
        note={
          shape.flexible == null
            ? `${shape.unknownAmountCount} ${shape.unknownAmountCount === 1 ? 'bill has' : 'bills have'} no amount yet.`
            : Number(shape.committed) === 0 && Number(shape.plannedSavings) === 0
              ? // Without this, a month with no plan shows a large "free" figure directly
                // under a much smaller "free until salary" and reads as a contradiction. It
                // is not one - nothing is planned in this month, which is worth saying.
                'Nothing planned this month'
              : `${formatMoney(shape.expectedIn)} in · ${formatMoney(shape.committed)} committed · ${formatMoney(shape.plannedSavings)} set aside`
        }
      />

      <MetricRow
        label={
          <WhyLabel
            text="If income stopped"
            docKey="today.runway"
            open={why === 'runway'}
            onClick={() => onWhy(why === 'runway' ? null : 'runway')}
          />
        }
        revealDelay={355}
        /* A badge, not a meter. A meter implies a scale with a maximum and runway has no
           natural one - two months and twenty months are both just numbers on an open axis.
           A bordered pill is an object *in* the row, which is the pattern that worked when
           three attempts at tinting rows did not (2026-09-30). */
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

      {/* ── Tier 3: the balance sheet ───────────────────────────────────────────── */}
      <GroupHead>What you owe</GroupHead>

      <MetricRow
        label={
          <WhyLabel
            text="Owed"
            docKey="today.owed"
            open={why === 'debt'}
            onClick={() => onWhy(why === 'debt' ? null : 'debt')}
          />
        }
        revealDelay={410}
        value={debt.totalOutstanding}
        note={
          <>
            {debt.emiShareOfIncome != null && `${formatPercent(debt.emiShareOfIncome)} of income to EMIs`}
            {debt.emiShareOfIncome != null && debt.debtFreeDate && ' · '}
            {/* formatDayMonthYear, not formatSalaryDate: that one takes a cycle *end* and
                adds a day to find payday, and it drops the year - on a date three years out
                the year is the whole point. */}
            {debt.debtFreeDate && `clear ${formatDayMonthYear(debt.debtFreeDate)}`}
            {debt.loansWithoutTerms > 0 && ` · ${debt.loansWithoutTerms} without terms`}
          </>
        }
      />
      <Basis open={why === 'debt'} basis={debt.basis} />

      <MetricRow
        label={<span {...netWorthRowDoc}>Net worth</span>}
        revealDelay={465}
        value={netWorth.netWorth}
        emphasiseNegative
        note={`${formatMoney(netWorth.totalAssets)} held · ${formatMoney(netWorth.totalLiabilities)} owed`}
      />

      {/* The only line that asks for anything, so it closes the block rather than sitting
          inside the balance sheet it is not part of. */}
      <MetricRow
        variant="footer"
        label={<span {...needsYouCountDoc}>Needs you</span>}
        revealDelay={520}
        valueNode={
          <Link to="/needs-you" className="num text-row text-ink underline-offset-4 hover:underline">
            {state.attentionCount}
          </Link>
        }
        note={
          state.attentionCount === 0
            ? 'Nothing waiting on a decision'
            : baseline.perCycle == null
              ? `${state.attentionCount === 1 ? 'One thing' : `${state.attentionCount} things`} to look at`
              : `${state.attentionCount === 1 ? 'One thing' : `${state.attentionCount} things`} to look at · you usually spend ${formatMoney(baseline.perCycle)} a month`
        }
      />
    </div>
  );
}

/**
 * A tier's name. Spans both columns so the tiers share one figure column - see the class
 * comment on why that matters.
 *
 * <p>Quiet on purpose: micro, uppercase, muted, with a hairline carrying across the rest of
 * the measure. It has to divide the block without competing with the figures, which are the
 * reason anyone is looking.
 */
function GroupHead({ children, first }: { children: ReactNode; first?: boolean }) {
  return (
    <div
      style={{ gridColumn: '1 / -1' }}
      className={cn('flex items-center gap-space-3', first ? 'pb-space-2' : 'pb-space-2 pt-space-6')}
    >
      <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">{children}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}

/**
 * One figure, its label, and the words that produced it.
 *
 * <p>`display: contents`, so the parent grid governs the columns - that is what makes digits
 * stack across every tier. The cells carry the rules, because a row with no box of its own
 * cannot hold a border.
 *
 * <p>The figure is top-aligned against the label rather than centred on the two-line block,
 * so label and figure sit on one optical line and the annotation hangs below both.
 */
function MetricRow({
  label,
  value,
  valueNode,
  valueClassName,
  note,
  belowNote,
  emphasiseNegative,
  variant = 'row',
  revealDelay,
}: {
  label: ReactNode;
  value?: string | null;
  valueNode?: ReactNode;
  /** Conditional tone for the figure. A colour, never a verdict (rule 8). */
  valueClassName?: string;
  note?: ReactNode;
  /** Anything that paints outside its own line - a progress rule's marker overflows its
   *  2px track, so this sits in a cell with no `truncate` on it. A note cropped along the
   *  row's bottom edge is how that was found the first time (2026-09-30). */
  belowNote?: ReactNode;
  emphasiseNegative?: boolean;
  variant?: 'row' | 'footer';
  revealDelay?: number;
}) {
  const cell = cn(
    variant === 'footer' ? 'border-t border-border pt-space-3 pb-space-1' : 'border-b border-line py-space-3',
    revealDelay != null && 'reveal',
  );
  const style = revealDelay != null ? ({ '--reveal-delay': `${revealDelay}ms` } as CSSProperties) : undefined;

  return (
    <div className="contents">
      <div className={cn(cell, 'min-w-0 pr-space-5')} style={style}>
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
        {belowNote}
      </div>

      <div className={cn(cell, 'text-right tabular-nums')} style={style}>
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

/**
 * The note beside "Spent today": "₹75 over today's ₹187 share".
 *
 * <p><strong>The share is named every time, not left as a bare comparison.</strong> "₹75
 * over" makes the reader work out over what, and the answer is a number that is not on the
 * row. Naming it costs four characters and removes the question.
 *
 * <p>"Left" cannot be negative - it is a contradiction in terms, and on screen "−₹75 left
 * today" reads as a fault rather than as a fact about the day. The user hit this on their
 * second real day and asked "how come -75 left today by the way", which is exactly the
 * question a number should not raise about itself. So past the day's share it changes word.
 *
 * <p>Magnitude comes from `splitMoney` rather than arithmetic on the amount
 * (FRONTEND_CONVENTIONS §4 rule 2); only the sign is read, which is a comparison.
 *
 * <p>Amber, and no verdict (rule 8). Spending more than a thirtieth of what is left on any
 * given day is completely normal - rent-sized days exist - and the honest reading is "today
 * took more than its share", not "you overspent".
 */
function SpentTodayNote({ roomToday, roomLeft }: { roomToday: string; roomLeft: string }) {
  const over = Number(roomLeft) < 0;
  const { symbol, digits } = splitMoney(roomLeft);
  const share = formatMoney(roomToday);
  return over ? (
    <>
      <span className="text-attention">
        {symbol}
        {digits} over
      </span>{' '}
      today’s {share} share.
    </>
  ) : (
    <>
      {formatMoney(roomLeft)} left of today’s {share} share.
    </>
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
