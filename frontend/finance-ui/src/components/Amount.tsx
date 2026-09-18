import { splitMoney, formatMoney, type Money } from '@/lib/money';
import { cn } from '@/lib/cn';

export type AmountRole = 'hero' | 'section' | 'row' | 'body' | 'caption';

interface AmountProps {
  value: Money | null | undefined;
  role?: AmountRole;
  /** Paise only in ledger detail - DESIGN_SYSTEM §12 rule 6. */
  paise?: boolean;
  /** Show a leading + on positives, where the sign itself is the point (a delta). */
  signed?: boolean;
  /** Colour negatives critical. Only where negative is genuinely bad - a spending row
   *  is not negative, it's spending (DESIGN_SYSTEM §12 rule 9). Off by default. */
  emphasiseNegative?: boolean;
  className?: string;
}

const ROLE_CLASSES: Record<AmountRole, string> = {
  hero: 'text-hero',
  section: 'text-section',
  row: 'text-row',
  body: 'text-body font-medium',
  caption: 'text-caption',
};

/**
 * Every rupee figure in the product renders through here.
 *
 * DESIGN_SYSTEM §3 "Number craft": the ₹ is set at 0.62em and muted so the digits
 * carry the weight, the minus is a true U+2212, and unknown is an em dash rather than
 * ₹0. The symbol is aria-hidden and the full figure is on the wrapper's aria-label, so
 * a screen reader says "twenty-five thousand six hundred and five rupees" once.
 */
export function Amount({
  value,
  role = 'row',
  paise,
  signed,
  emphasiseNegative,
  className,
}: AmountProps) {
  const { sign, symbol, digits, unknown, negative } = splitMoney(value, { paise, signed });

  if (unknown) {
    return (
      <span className={cn('num', ROLE_CLASSES[role], 'text-ink-muted', className)} aria-label="not known yet">
        —
      </span>
    );
  }

  return (
    <span
      className={cn('num whitespace-nowrap', ROLE_CLASSES[role], emphasiseNegative && negative && 'text-critical', className)}
      aria-label={formatMoney(value, { paise })}
    >
      {sign}
      {/* Opacity rather than a fixed grey, so the symbol recedes against whatever
          colour the digits carry - the teal hero included. */}
      <span aria-hidden className="text-[0.62em] opacity-55" style={{ marginRight: '0.08em' }}>
        {symbol}
      </span>
      {digits}
    </span>
  );
}
