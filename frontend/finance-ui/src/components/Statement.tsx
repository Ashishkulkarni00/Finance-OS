import { createContext, useContext, type ReactNode } from 'react';
import { Amount, type AmountRole } from './Amount';
import { cn } from '@/lib/cn';
import type { Money } from '@/lib/money';

/** Rows must render the same number of cells as the parent has columns, or the grid
 *  tracks shift and the whole point (alignment) is lost. */
const NotesColumn = createContext(false);

interface StatementProps {
  children: ReactNode;
  /** Adds a third column for the plain-language annotation beside each figure. */
  notes?: boolean;
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
export function Statement({ children, notes, className }: StatementProps) {
  return (
    <NotesColumn.Provider value={notes ?? false}>
      <div
        className={cn('grid w-full', className)}
        style={{ gridTemplateColumns: notes ? '1fr auto minmax(0, 22rem)' : '1fr auto' }}
      >
        {children}
      </div>
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
}: StatementRowProps) {
  const hasNotesColumn = useContext(NotesColumn);
  const cell = cn(EDGE[variant], indent ? 'py-space-2' : PAD[variant]);
  const valueRole = indent ? 'caption' : VALUE_ROLE[variant];

  return (
    <div className="contents">
      <div className={cn(cell, 'min-w-0 pr-space-5', indent && 'pl-space-4')}>
        <span className={cn('block truncate', indent ? 'text-caption text-ink-muted' : LABEL_CLASSES[variant])}>{label}</span>
      </div>

      <div className={cn(cell, 'text-right tabular-nums')}>
        {valueNode ?? (
          <span className={cn('inline-flex items-baseline', accent && 'text-accent')}>
            {deduct && !accent && <span className="num mr-[0.15em] text-ink-muted">−</span>}
            <Amount value={value} role={valueRole} paise={paise} emphasiseNegative={emphasiseNegative} />
          </span>
        )}
      </div>

      {hasNotesColumn && (
        <div className={cn(cell, 'pl-space-5')}>
          {note !== undefined && <span className="block text-caption text-ink-muted">{note}</span>}
        </div>
      )}
    </div>
  );
}
