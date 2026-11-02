import { useId, useState, type ReactNode } from 'react';
import { Amount } from '@/components/Amount';
import { cn } from '@/lib/cn';
import type { Money } from '@/lib/money';
import { percent, scaleOf } from './chartScale';

/** One stacked band in a column. Tones are the chart tokens in `index.css`, not arbitrary
 *  colours - see the note there on why committed and flexible are two steps of one hue
 *  rather than two hues. */
export type ColumnTone = 'committed' | 'flexible' | 'invest' | 'neutral';

export interface ColumnSegment {
  key: string;
  label: string;
  value?: Money | null;
  tone: ColumnTone;
}

export interface ColumnDatum {
  key: string;
  /** The short label under the column - a month name, not a date range. */
  label: string;
  /** Stacked from the baseline up, in the order given. */
  segments: ColumnSegment[];
  /** A horizontal rule across the column - income, drawn as a ceiling the stack can exceed. */
  reference?: { value?: Money | null; label: string };
  /** False when the month has nothing recorded in it. Drawn as a visible gap, never a zero bar. */
  recorded: boolean;
  current?: boolean;
}

interface ColumnChartProps {
  data: ColumnDatum[];
  /** Stated above the chart per DESIGN_SYSTEM §8 - if it can't be written, the chart goes. */
  takeaway: ReactNode;
  /** Describes the chart for anyone who can't see it. The statement below it is the data. */
  description: string;
  height?: number;
  className?: string;
}

const TONE_FILL: Record<ColumnTone, string> = {
  committed: 'var(--chart-committed)',
  flexible: 'var(--chart-flexible)',
  invest: 'var(--chart-invest)',
  neutral: 'var(--chart-neutral)',
};

/** Between stacked bands. 2px of the page showing through is what separates two steps of
 *  the same hue - the fills alone are deliberately close in lightness. */
const GAP = 2;

/**
 * Columns are a fixed width and the row is left-aligned, rather than each column taking an
 * equal share of the measure.
 *
 * <p>With three months, an equal share is 340px a column, and a 340px bar is a block: the
 * eye reads a filled rectangle, not a height. Fixing the width means two months and twelve
 * months look like the same instrument at different lengths, which is the point - the
 * chart should not change character as the data accumulates.
 */
const COLUMN_WIDTH = 56;
const COLUMN_GAP = 14;

/**
 * Columns per salary month, stacked, with income as a rule across each one.
 *
 * <p>Plain HTML rather than SVG, deliberately: at this size a column chart is boxes and
 * baselines, and CSS gives crisp hairlines at any width with no viewBox arithmetic and no
 * stroke distortion. The debt curve is SVG because a curve genuinely needs a path.
 *
 * <p>Follows DESIGN_SYSTEM §8 - no gridlines, no axis borders, no legend box. Identity
 * comes from direct labels under the readout, so it is never colour alone, and the exact
 * figures live in the statement the caller puts underneath: this draws the *shape*, and the
 * shape is all it claims to draw.
 *
 * <p>Hovering or focusing a column moves the readout above the plot. The readout shows the
 * latest month by default, so the page is not blank until the mouse arrives.
 */
export function ColumnChart({ data, takeaway, description, height = 180, className }: ColumnChartProps) {
  const describedBy = useId();
  const [active, setActive] = useState<number | null>(null);

  const values = data.flatMap((column) => [
    ...column.segments.map((segment) => segment.value),
    column.reference?.value,
  ]);
  const scale = scaleOf(values);
  const columns = {
    gridTemplateColumns: `repeat(${data.length}, ${COLUMN_WIDTH}px)`,
    columnGap: `${COLUMN_GAP}px`,
  };

  // The latest column that has anything in it - the sensible resting state for the readout.
  const fallback = data.reduce((latest, column, index) => (column.recorded ? index : latest), -1);
  const shown = active ?? (fallback >= 0 ? fallback : null);
  const readout = shown == null ? null : data[shown]!;

  return (
    <figure className={cn('m-0 flex flex-col gap-space-4', className)}>
      <figcaption className="flex flex-col gap-space-3">
        <p className="max-w-[64ch] text-body text-ink-soft">{takeaway}</p>

        {/* The readout, not a floating tooltip: a box that appears under the cursor moves the
            page about and covers the data it describes. This holds its place. */}
        <div className="flex min-h-[2.75rem] flex-wrap items-baseline gap-x-space-5 gap-y-space-1 border-b border-line pb-space-2">
          {readout ? (
            <>
              <span className="text-label font-medium text-ink">
                {readout.label}
                {readout.current && <span className="ml-space-2 text-caption font-normal text-ink-muted">so far</span>}
              </span>
              {readout.reference?.value != null && (
                <ReadoutFigure label={readout.reference.label} value={readout.reference.value} />
              )}
              {readout.segments.map((segment) => (
                <ReadoutFigure key={segment.key} label={segment.label} value={segment.value} tone={segment.tone} />
              ))}
            </>
          ) : (
            <span className="text-label text-ink-muted">Nothing recorded in these months yet.</span>
          )}
        </div>
      </figcaption>

      <div className="flex flex-col gap-space-2">
        <div
          className="grid items-end"
          style={{ height, ...columns, justifyContent: 'start' }}
          aria-describedby={describedBy}
          role="img"
        >
          {data.map((column, index) => (
            <Column
              key={column.key}
              column={column}
              fraction={scale.fraction}
              active={shown === index}
              onActivate={() => setActive(index)}
              onLeave={() => setActive(null)}
            />
          ))}
        </div>

        {/* The one rule on the plot: the baseline. No gridlines, by §8. */}
        <div className="h-px w-full bg-ink" />

        <div className="grid" style={{ ...columns, justifyContent: 'start' }}>
          {data.map((column) => (
            <span
              key={column.key}
              // Not truncated: a column is narrower than its month name on purpose, and the
              // name is the one thing that must stay readable. Neighbouring labels are
              // centred on their own column, so a long name bleeds into the gap, not over
              // the next word.
              className={cn(
                'whitespace-nowrap text-center text-micro',
                column.current ? 'font-medium text-ink' : 'text-ink-muted',
              )}
            >
              {column.label}
            </span>
          ))}
        </div>
      </div>

      <p id={describedBy} className="sr-only">
        {description}
      </p>
    </figure>
  );
}

function ReadoutFigure({ label, value, tone }: { label: string; value?: Money | null; tone?: ColumnTone }) {
  return (
    <span className="flex items-baseline gap-space-2">
      {tone && (
        <span
          aria-hidden
          className="h-[3px] w-space-3 shrink-0 self-center"
          style={{ background: TONE_FILL[tone] }}
        />
      )}
      <span className="text-caption text-ink-muted">{label}</span>
      <Amount value={value ?? null} role="caption" className="text-ink" />
    </span>
  );
}

function Column({
  column,
  fraction,
  active,
  onActivate,
  onLeave,
}: {
  column: ColumnDatum;
  fraction: (value?: Money | null) => number;
  active: boolean;
  onActivate: () => void;
  onLeave: () => void;
}) {
  // Stacked from the baseline up. The offset is carried in fractions so the bands sit on
  // each other exactly; the 2px separation is taken off in CSS, after the percentage.
  let offset = 0;
  const bands = column.segments.map((segment) => {
    const size = fraction(segment.value);
    const band = { segment, bottom: offset, size };
    offset += size;
    return band;
  });

  const referenceFraction = column.reference?.value != null ? fraction(column.reference.value) : null;

  return (
    <div
      className="relative h-full"
      onMouseEnter={onActivate}
      onMouseLeave={onLeave}
      onFocus={onActivate}
      onBlur={onLeave}
      tabIndex={0}
    >
      {/* A month with nothing in it is drawn as an explicit dashed gap. A zero-height bar
          would read as "nothing happened", which is not what an empty month means. */}
      {!column.recorded ? (
        <span className="absolute inset-x-0 bottom-0 border-t border-dashed border-border" />
      ) : (
        bands.map(({ segment, bottom, size }, index) => (
          <span
            key={segment.key}
            title={`${column.label} · ${segment.label}`}
            className="absolute inset-x-0"
            style={{
              bottom: index === 0 ? percent(bottom) : `calc(${percent(bottom)} + ${GAP}px)`,
              height: index === 0 ? percent(size) : `calc(${percent(size)} - ${GAP}px)`,
              background: TONE_FILL[segment.tone],
              // Rounded only at the top of the stack, anchored flat to the baseline -
              // a bar rounded at both ends floats off its own axis.
              borderTopLeftRadius: index === bands.length - 1 ? 3 : 0,
              borderTopRightRadius: index === bands.length - 1 ? 3 : 0,
            }}
          />
        ))
      )}

      {referenceFraction != null && column.recorded && (
        // The rule carries its own gutter of page colour, so it stays a hairline wherever it
        // falls - including inside a column that has run past it, which is exactly the month
        // worth noticing. An earlier version used a box-shadow halo in `--surface`, which is
        // white while the page is `--ground`: on a dark fill it read as a printed stripe.
        // It also oversteps the column by 3px on each side, so it is unmistakably a separate
        // mark rather than part of the bar.
        <span
          aria-hidden
          title={`${column.label} · ${column.reference!.label}`}
          className="absolute -inset-x-[3px] flex h-[6px] items-center"
          style={{ bottom: `calc(${percent(referenceFraction)} - 3px)`, background: 'var(--ground)' }}
        >
          <span className="h-[2px] w-full" style={{ background: 'var(--chart-income)' }} />
        </span>
      )}

      {/* The hovered column is marked by a hairline under it, not by a colour change -
          repainting a bar on hover makes the eye read a different value. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-x-0 -bottom-px h-[2px] transition-opacity duration-150',
          active ? 'opacity-100' : 'opacity-0',
        )}
        style={{ background: 'var(--chart-income)' }}
      />
    </div>
  );
}
