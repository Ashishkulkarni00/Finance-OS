import type { CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface LedgerRowProps {
  /** Milliseconds to hold this row back on first paint, so a list reads as one thing
   *  arriving. Opt-in: a register the user is scrolling must not re-perform itself. */
  revealDelay?: number;
  /** Where the row opens. Every register row is a way in to its detail page. Omit and
   *  pass `onClick` instead for a row whose click opens something other than a route -
   *  the Ledger's rows open an edit sheet in place, not a page. */
  to?: string;
  /** Alternative to `to` - called instead of navigating. Exactly one of the two should
   *  be given; if both are, `onClick` wins. */
  onClick?: () => void;
  /** A domain rule, a status tick - identity in the left margin. */
  leading?: ReactNode;
  primary: ReactNode;
  /** The qualitative line under the name: what kind of thing this is, or why it matters. */
  secondary?: ReactNode;
  /** The right-aligned supporting facts - a due date, an account, a second figure.
   *  This is what keeps a wide row from becoming a name marooned from its number. */
  meta?: ReactNode;
  /** The headline figure. May stack a caption under it. */
  amount: ReactNode;
  action?: ReactNode;
  /** Hold the action column's width even with no action, so figures stay aligned with
   *  sibling rows that do have one. */
  reserveAction?: boolean;
  /** Width of the action column. Defaults to one small button's worth. */
  actionWidth?: string;
  /** Quieter and tighter - for rows that are done and no longer competing for attention. */
  muted?: boolean;
}

/**
 * One line of a register - an account, a card, a debt, a commitment. Clickable, ruled,
 * with its figures in fixed columns.
 *
 * <p>A grid, not a flex row with a greedy name. With only a name and an amount, every
 * pixel of slack collected in the middle and threw the amount to the far edge, hundreds
 * of pixels from the thing it belonged to. Narrowing the row isn't the cure - at this
 * measure the slack has to go somewhere. Giving the right-hand side enough real content
 * to read as a block is: supporting facts, headline figure and action cluster together,
 * and the whitespace ends up inside the name's own track, where it reads as breathing
 * room rather than a chasm.
 *
 * <p>The money tracks are fixed widths rather than {@code auto} because each row is its
 * own grid - with {@code auto}, a row with an action button and one without would size
 * their columns independently and the figures would not line up down the page.
 *
 * <p>A `<button>` can't nest inside a `<button>`, so this is a `div[role=button]` with
 * the action as a real sibling that stops propagation. The chevron sits outside that
 * zone, part of the row's own click target, and is the cue that the row opens at all.
 */
export function LedgerRow({
  to,
  onClick,
  leading,
  primary,
  secondary,
  meta,
  amount,
  action,
  reserveAction,
  actionWidth,
  muted,
  revealDelay,
}: LedgerRowProps) {
  const navigate = useNavigate();
  const go = onClick ?? (() => to && navigate(to));
  const hasAction = action != null || reserveAction === true;

  const columns = [
    leading != null ? 'auto' : null,
    'minmax(0,1fr)',
    'auto',
    '8rem',
    hasAction ? (actionWidth ?? '5.5rem') : null,
    'auto',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      }}
      style={
        {
          gridTemplateColumns: columns,
          ...(revealDelay != null ? { '--reveal-delay': `${revealDelay}ms` } : {}),
        } as CSSProperties
      }
      className={cn(
        'group grid w-full cursor-pointer items-center gap-space-4',
        '-mx-space-2 rounded-lg border-b border-line px-space-2 text-left transition-colors duration-150',
        'last:border-b-0 hover:bg-sunken',
        muted ? 'py-space-2' : 'py-space-3',
        revealDelay != null && 'reveal',
      )}
    >
      {leading != null && leading}

      <div className="min-w-0">
        <div className={cn('truncate text-row', muted ? 'text-ink-muted' : 'text-ink')}>{primary}</div>
        {secondary != null && <div className="truncate text-caption text-ink-muted">{secondary}</div>}
      </div>

      <div className="text-right text-caption leading-tight text-ink-muted">{meta}</div>

      <div className="text-right leading-tight">{amount}</div>

      {hasAction && (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      )}

      <ChevronRight
        size={16}
        strokeWidth={1.5}
        className="shrink-0 text-ink-soft transition-[color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[2px] group-hover:text-ink-muted"
        aria-hidden
      />
    </div>
  );
}

interface MetaFact {
  label: string;
  value: ReactNode;
  /** Colour override for the value - an overdue date, say. */
  className?: string;
}

/**
 * The meta column as labelled facts rather than bare strings.
 *
 * <p>"2 Sep" and "IDBI" stacked in a corner are only meaningful to whoever wrote the
 * code - the reader has to guess whether the date is when it was due or when it was
 * paid, and that a bank's name is an account at all. Naming each fact costs one word
 * and removes the guess: "Paid on 2 Sep", "Paid from IDBI".
 */
export function MetaFacts({ items }: { items: MetaFact[] }) {
  return (
    <span className="inline-grid grid-cols-[auto_auto] gap-x-space-2 text-left">
      {items.map((item) => (
        <span key={item.label} className="contents">
          <span className="whitespace-nowrap text-right text-ink-soft">{item.label}</span>
          <span className={cn('truncate', item.className ?? 'text-ink-muted')}>{item.value}</span>
        </span>
      ))}
    </span>
  );
}

/** The 3px domain hue from DESIGN_SYSTEM §6, sized for a row rather than a card. */
export function DomainRule({ domain }: { domain: 'commit' | 'goal' | 'debt' | 'invest' }) {
  return <span aria-hidden className="h-8 w-[3px] shrink-0 rounded-full" style={{ background: `var(--${domain})` }} />;
}
