import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  error?: string;
  /** Overrides the digits' colour - the transaction form tints this per type
   *  (critical for Expense, positive for Income) so which direction you're recording
   *  is legible while you're still typing the amount, not only after you save it. */
  valueClassName?: string;
}

/**
 * The capture surface - ₹ pre-filled. Desktop is keyboard-first (SCREEN_SPECS S2), so
 * this is a plain numeric field, not a tap-keypad grid - that's the mobile-specific
 * interpretation of "AmountPad".
 *
 * <p>Sized at 28px, between `text-section` (24px) and `text-hero` (44px): hero is the
 * size a figure gets when it's the one thing on a whole screen (Month's crux, Accounts'
 * net worth) - inside a compact modal row, that size fought every other field around it
 * instead of leading them; but at a plain `text-section` it read too close to the row
 * labels beneath it to still feel like the field the whole sheet exists for. 28px
 * matches the size DESIGN_SYSTEM already uses for editorial prose (`--text-editorial`),
 * borrowed here for the number rather than reusing that class directly - editorial text
 * is deliberately light (weight 400); an amount stays at the same semibold weight every
 * other money figure in the product uses.
 */
export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(({ error, valueClassName, ...rest }, ref) => {
  return (
    <div className="flex flex-col items-center gap-space-2">
      <div className="flex items-baseline gap-space-1">
        <span aria-hidden className="num text-title text-ink-muted opacity-55" style={{ marginRight: '0.08em' }}>
          ₹
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          {...rest}
          className={cn(
            'num w-44 bg-transparent text-[28px] leading-[34px] font-semibold outline-none placeholder:text-ink-muted',
            valueClassName ?? 'text-ink',
          )}
        />
      </div>
      {error && <span className="text-caption text-critical">{error}</span>}
    </div>
  );
});
AmountInput.displayName = 'AmountInput';
