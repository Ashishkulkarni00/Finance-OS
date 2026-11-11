import type { CSSProperties, ReactNode } from 'react';
import { CreditCard, Landmark, PiggyBank, ReceiptText, type LucideIcon } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import { formatMoney, type Money } from '@/lib/money';
import type { PositionResponse } from '@/types/position';

type OkPosition = Extract<PositionResponse, { state: 'OK' }>;

/** A round, washed mark for what a row is made of. Colour is the app's own domain hues (held = the accent,
 *  reserved = goals, committed = bills, cards = debt) so a hue means the same thing here as on Money. */
function Mark({ icon: Icon, hue }: { icon: LucideIcon; hue: string }) {
  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-full"
      style={{ color: hue, backgroundColor: `color-mix(in srgb, ${hue} 12%, var(--surface))` } as CSSProperties}
    >
      <Icon size={14} strokeWidth={1.5} />
    </span>
  );
}

/** One line of the working: mark, label (with what it is made of beneath it), right-aligned figure. */
function Line({
  icon,
  hue,
  label,
  hint,
  note,
  value,
  deduct,
  emphasiseNegative,
  anchor,
}: {
  icon: LucideIcon;
  hue: string;
  label: string;
  /** Wide screens only: what the line means, in a few words. */
  hint?: string;
  /** Always shown, small: something specific about this figure. */
  note?: ReactNode;
  value: Money;
  deduct?: boolean;
  emphasiseNegative?: boolean;
  anchor?: ReturnType<typeof useDocAnchor>;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-space-3">
      <Mark icon={icon} hue={hue} />
      <div className="min-w-0" {...anchor}>
        <span className="block text-label text-ink-soft">{label}</span>
        {hint && <span className="block text-caption text-ink-muted max-md:hidden">{hint}</span>}
        {note && <span className="block text-caption text-ink-muted">{note}</span>}
      </div>
      <span className="inline-flex items-baseline justify-end">
        {deduct && <span className="num mr-[0.2em] text-ink-muted">−</span>}
        <Amount value={value} role="row" className="text-ink" emphasiseNegative={emphasiseNegative} />
      </span>
    </div>
  );
}

/**
 * "Where you stand" - the product's core equation as one card (2026-11-11 redesign):
 *
 *   held − reserved − committed − owed on cards = FREE UNTIL SALARY
 *
 * <p>The three deductions are separated, each with its own mark and a right-aligned figure in one
 * column, then a hairline and the answer on a teal band. The answer is the only large figure in the
 * card and the only filled surface, so what is genuinely free is the thing the eye lands on without
 * any extra colour.
 *
 * <p>Every figure is the server's `position.breakdown` and `realBalance`; no arithmetic. Two things
 * the old statement said are kept because they are facts, not decoration:
 * <ul>
 *   <li>**An account below zero** is named under Held, because it lowers Held and the page can't tell
 *       an overdraft from a loan added as a bank account - so it says both rather than guessing.</li>
 *   <li>**Optional bills** inside Committed are called out, since they are the part that could be
 *       skipped.</li>
 * </ul>
 * "Owed on cards" appears only when something is owed. The per-account and per-bill lists live on the
 * Money and Month pages; they are no longer a toggle here (user, 2026-11-11).
 */
export function WhereYouStand({ position }: { position: OkPosition }) {
  const { breakdown } = position;
  const heldDoc = useDocAnchor('position.held');
  const reservedDoc = useDocAnchor('position.reserved');
  const committedDoc = useDocAnchor('position.committed');
  const owedCardsDoc = useDocAnchor('position.owed-cards');

  // A comparison, not arithmetic.
  const belowZero = breakdown.accounts.filter((a) => Number(a.balance) < 0);
  const optional = Number(breakdown.optionalCommitted) > 0 ? breakdown.optionalCommitted : null;

  return (
    <section className="flex max-w-[44rem] flex-col gap-space-4 rounded-2xl border border-line bg-surface p-space-4 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_20px_-12px_rgb(0_0_0/0.12)]">
      <h2 className="text-sectiontitle text-ink">Where you stand</h2>

      <div className="flex flex-col gap-space-3">
        <Line
          icon={Landmark}
          hue="var(--accent)"
          label="Held across accounts"
          hint="Bank and cash only - not cards, loans or investments."
          value={breakdown.held}
          anchor={heldDoc}
        />
        {belowZero.length > 0 && (
          <p className="-mt-space-1 pl-[40px] text-caption text-attention">
            {belowZero.map((a) => `${a.name} is ${formatMoney(a.balance)}`).join(', ')} - below zero, so it lowers this. If it is a
            loan, add it under Debts instead.
          </p>
        )}
        <Line
          icon={PiggyBank}
          hue="var(--goal)"
          label="Reserved"
          hint="Set aside for something specific. Not yours to spend."
          value={breakdown.reserved}
          deduct
          anchor={reservedDoc}
        />
        <Line
          icon={ReceiptText}
          hue="var(--commit)"
          label="Committed"
          hint="Bills still to leave before your next salary."
          note={optional ? <>includes {formatMoney(optional)} you could skip</> : undefined}
          value={breakdown.committed}
          deduct
          anchor={committedDoc}
        />
        {Number(breakdown.cardDues) > 0 && (
          <Line
            icon={CreditCard}
            hue="var(--debt)"
            label="Owed on credit cards"
            hint="Already spent. Paying the bill moves money, it doesn't spend it again."
            value={breakdown.cardDues}
            deduct
            anchor={owedCardsDoc}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-space-3 rounded-xl bg-accent-wash px-space-3 py-space-3 ring-1 ring-inset ring-accent/15">
        <span className="min-w-0">
          <span className="block text-label font-semibold text-ink">Free until salary</span>
          <span className="block text-caption text-ink-muted max-md:hidden">What is genuinely yours to decide about.</span>
        </span>
        <Amount value={position.realBalance} role="hero" className="shrink-0 text-accent" emphasiseNegative />
      </div>
    </section>
  );
}
