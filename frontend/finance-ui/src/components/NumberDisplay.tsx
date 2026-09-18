import type { ReactNode } from 'react';
import { Amount } from './Amount';
import { formatMoney, type Money } from '@/lib/money';
import { cn } from '@/lib/cn';

type Role = 'hero' | 'section' | 'row';

interface NumberDisplayProps {
  label: string;
  value: Money | null | undefined;
  /** "of ₹12,000" - DESIGN_SYSTEM §12 rule 7: always show what a number is of. */
  of?: Money;
  /** Precomputed by the server - the frontend never divides to get this. */
  percent?: number;
  role?: Role;
  /** Present only when there is a real breakdown to show - DESIGN_SYSTEM §6. */
  onExplain?: () => void;
  trailing?: ReactNode;
}

const ROLE_TEXT: Record<Role, string> = {
  hero: 'text-ink',
  section: 'text-ink',
  row: 'text-ink',
};

/**
 * The most-used component in the product (DESIGN_SYSTEM §6):
 *   LABEL                      micro, uppercase, muted
 *   ₹10,021                    tabular, size by role
 *   of ₹12,000 · 84%           caption, muted
 * Tappable when it has a breakdown - affordance is a subtle underline on hover,
 * never a chevron.
 */
export function NumberDisplay({ label, value, of, percent, role = 'section', onExplain, trailing }: NumberDisplayProps) {
  const Wrapper = onExplain ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onExplain}
      className={cn('group flex flex-col items-start gap-space-2 text-left', onExplain && 'cursor-pointer')}
      type={onExplain ? 'button' : undefined}
    >
      <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">{label}</span>
      <Amount
        value={value}
        role={role}
        className={cn(ROLE_TEXT[role], onExplain && 'group-hover:underline decoration-border underline-offset-4')}
      />
      {(of || percent != null) && (
        <span className="num text-caption text-ink-muted">
          {of && <>of {formatMoney(of)}</>}
          {of && percent != null && ' · '}
          {percent != null && <>{percent}%</>}
        </span>
      )}
      {trailing}
    </Wrapper>
  );
}
