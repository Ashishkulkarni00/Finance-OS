import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { Amount, type AmountRole } from './Amount';
import { cn } from '@/lib/cn';
import type { Money } from '@/lib/money';

/** Rows must render the same number of cells as the parent has columns, or the grid
 *  tracks shift and the whole point (alignment) is lost. */
const NotesColumn = createContext(false);
const Leaders = createContext(false);

interface StatementProps {
  children: ReactNode;
  /** Adds a third column for the plain-language annotation beside each figure. */
  notes?: boolean;
  /**
   * Draws a dotted leader from each label to its figure.
   *
   * <p>Right-aligning figures is what makes digits stack, and on a wide measure that
   * leaves a long empty run between a short label and its number - the eye loses the row
   * halfway across and has to start again. Closing the gap would fix the tracking and
   * destroy the alignment, which is the more valuable of the two.
   *
   * <p>A leader keeps both: the gap stays, and the eye is carried over it. Indexes, menus
   * and printed ledgers have solved it this way for a very long time, and this statement
   * is modelled on exactly those.
   *
   * <p>Off by default - it earns its keep on a full-width statement and only adds noise on
   * a narrow one, where the run is short enough to cross unaided.
   */
  leaders?: boolean;
  className?: string;
}

/**
 * A financial statement: labels left, figures right-aligned in one shared column,
 * hairline-ruled, with an optional annotation column.
 *
 * The alignment is the whole point - rows are `display: contents` so the parent grid
 * governs the columns, which is what makes digits stack across rows. DESIGN_SYSTEM §1
 * ("Precise - tabular figures, aligned decimals") and §12: a derivation the user can
 * follow is what makes a number trustworthy rather than merely displayed.
 */
export function Statement({ children, notes, leaders, className }: StatementProps) {
  return (
    <NotesColumn.Provider value={notes ?? false}>
      <Leaders.Provider value={leaders ?? false}>
        <div
          className={cn('grid w-full', className)}
          style={{ gridTemplateColumns: notes ? '1fr auto minmax(0, 22rem)' : '1fr auto' }}
        >
          {children}
        </div>
      </Leaders.Provider>
    </NotesColumn.Provider>
  );
}

type Variant = 'row' | 'subtotal' | 'total' | 'hero';

interface StatementRowProps {
  label: ReactNode;
  value?: Money | null;
  /** Renders a true minus before the figure. Notation for "this is being taken away",
   *  not arithmetic - the server still owns every number shown. */
  deduct?: boolean;
  note?: ReactNode;
  variant?: Variant;
  paise?: boolean;
  /** Escape hatch for a trailing figure that isn't money (a day count, a percentage). */
  valueNode?: ReactNode;
  emphasiseNegative?: boolean;
  accent?: boolean;
  /** A constituent of the row above it - quieter, and stepped in. */
  indent?: boolean;
  /**
   * Milliseconds to hold this row back on first paint, for a group that should read as one
   * summary arriving rather than N separate events (DESIGN_SYSTEM §10).
   *
   * <p>Applied to the **cells**, not the row: a row is `display: contents` and has no box of
   * its own to animate. All three cells carry the same delay, so they move together and the
   * alignment never breaks mid-flight.
   *
   * <p>Opt-in and off by default. A statement the user has scrolled back to should not
   * re-perform itself.
   */
  revealDelay?: number;
}

const VALUE_ROLE: Record<Variant, AmountRole> = {
  row: 'row',
  subtotal: 'row',
  total: 'section',
  hero: 'hero',
};

const LABEL_CLASSES: Record<Variant, string> = {
  row: 'text-label text-ink-soft',
  subtotal: 'text-label font-semibold text-ink',
  total: 'text-label font-semibold uppercase tracking-[0.04em] text-ink',
  hero: 'text-micro uppercase tracking-[0.04em] text-ink-muted',
};

/** Cells carry the rules, because a `display: contents` row cannot hold a border. */
const EDGE: Record<Variant, string> = {
  row: 'border-b border-line',
  subtotal: 'border-t border-border',
  total: 'border-t-2 border-ink',
  hero: 'border-t-2 border-ink',
};

const PAD: Record<Variant, string> = {
  row: 'py-space-3',
  subtotal: 'py-space-3',
  total: 'pt-space-4 pb-space-3',
  hero: 'pt-space-4 pb-space-3',
};

export function StatementRow({
  label,
  value,
  deduct,
  note,
  variant = 'row',
  paise,
  valueNode,
  emphasiseNegative,
  accent,
  indent,
  revealDelay,
}: StatementRowProps) {
  const hasNotesColumn = useContext(NotesColumn);
  // A constituent line is already stepped in and sits directly under its parent, so it has
  // no long run to cross - a leader there would be decoration.
  const hasLeader = useContext(Leaders) && !indent;
  const cell = cn(EDGE[variant], indent ? 'py-space-2' : PAD[variant], revealDelay != null && 'reveal');
  const cellStyle = revealDelay != null ? ({ '--reveal-delay': `${revealDelay}ms` } as CSSProperties) : undefined;
  const valueRole = indent ? 'caption' : VALUE_ROLE[variant];
  const labelClass = indent ? 'text-caption text-ink-muted' : LABEL_CLASSES[variant];

  return (
    <div className="contents">
      <div className={cn(cell, 'min-w-0 pr-space-5', indent && 'pl-space-4')} style={cellStyle}>
        {hasLeader ? (
          <span className="flex items-baseline gap-space-2">
            <span className={cn('min-w-0 truncate', labelClass)}>{label}</span>
            {/* Absolutely positioned so it rides just under the baseline rather than
                stretching the row, and hidden from assistive tech - it carries the eye,
                not meaning. */}
            <span aria-hidden className="relative min-w-space-4 flex-1 self-baseline">
              <span className="absolute inset-x-0 bottom-[0.28em] border-b border-dotted border-line" />
            </span>
          </span>
        ) : (
          <span className={cn('block truncate', labelClass)}>{label}</span>
        )}
      </div>

      <div className={cn(cell, 'text-right tabular-nums')} style={cellStyle}>
        {valueNode ?? (
          <span className={cn('inline-flex items-baseline', accent && 'text-accent')}>
            {deduct && !accent && <span className="num mr-[0.15em] text-ink-muted">−</span>}
            <Amount value={value} role={valueRole} paise={paise} emphasiseNegative={emphasiseNegative} />
          </span>
        )}
      </div>

      {hasNotesColumn && (
        <div className={cn(cell, 'pl-space-5')} style={cellStyle}>
          {note !== undefined && <span className="block text-caption text-ink-muted">{note}</span>}
        </div>
      )}
    </div>
  );
}
