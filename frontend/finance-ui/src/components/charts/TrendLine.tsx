import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Money } from '@/lib/money';
import { toNumber } from './chartScale';

export interface TrendPoint {
  /** The x label, already formatted. Only some are printed - see `labelEvery`. */
  label: string;
  value?: Money | null;
}

/** A point on the line worth naming - a loan clearing, say. */
export interface TrendMarker {
  key: string;
  /** Index into `points`. Out-of-range markers are dropped rather than clamped onto the end. */
  index: number;
  label: string;
}

interface TrendLineProps {
  points: TrendPoint[];
  takeaway: ReactNode;
  description: string;
  markers?: TrendMarker[];
  /** Print every nth x label. The rest are unlabelled - a 37-month axis cannot carry 37. */
  labelEvery?: number;
  height?: number;
  className?: string;
}

/** The viewBox is fixed and the SVG stretches to its container; strokes keep their real
 *  width through `vector-effect`, so nothing is distorted by the scaling. */
const VIEW_WIDTH = 1000;

/**
 * One series over time, as a line with its area under it.
 *
 * <p>A line, not columns, because this is the one genuinely continuous series on the screen
 * - a balance exists on every day between two EMIs, where a month's spend does not exist
 * between two months (DESIGN_SYSTEM §8: bars for discrete periods, lines only for real
 * continuity).
 *
 * <p>SVG here, where the column chart is CSS: a path is a path. No gridlines and no axis
 * box; the baseline is the zero rule, and the only printed values are the ends of the line,
 * which are the two numbers the chart is actually about.
 */
export function TrendLine({
  points,
  takeaway,
  description,
  markers = [],
  labelEvery = 6,
  height = 200,
  className,
}: TrendLineProps) {
  const describedBy = useId();
  const gradientId = useId();

  const usable = points.filter((point) => point.value != null);
  if (usable.length < 2) {
    return (
      <figure className={cn('m-0 flex flex-col gap-space-3', className)}>
        <figcaption className="max-w-[64ch] text-body text-ink-soft">{takeaway}</figcaption>
      </figure>
    );
  }

  const max = points.reduce((highest, point) => Math.max(highest, toNumber(point.value)), 0);
  const stepX = VIEW_WIDTH / (points.length - 1);
  // Inset vertically so a 2px stroke at either extreme is not half-clipped by the viewBox.
  const INSET = 3;
  const y = (value?: Money | null) =>
    max <= 0 ? height - INSET : height - INSET - (toNumber(value) / max) * (height - INSET * 2);

  const coords = points.map((point, index) => ({ x: index * stepX, y: y(point.value) }));
  const line = coords.map(({ x, y: py }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${py.toFixed(1)}`).join(' ');
  const area = `${line} L${VIEW_WIDTH} ${height} L0 ${height} Z`;

  const first = points[0]!;
  const last = points[points.length - 1]!;

  return (
    <figure className={cn('m-0 flex flex-col gap-space-4', className)}>
      <figcaption className="max-w-[64ch] text-body text-ink-soft">{takeaway}</figcaption>

      <div className="flex flex-col gap-space-2">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
          preserveAspectRatio="none"
          style={{ height }}
          className="w-full overflow-visible"
          role="img"
          aria-describedby={describedBy}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              {/* The one gradient allowed anywhere near data: it tints the *area*, which
                  encodes nothing - the line is the value. DESIGN_SYSTEM §7 rule 2 bans
                  gradients on data, and a fill under a line is not the data. */}
              <stop offset="0%" stopColor="var(--chart-debt)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--chart-debt)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={line}
            fill="none"
            stroke="var(--chart-debt)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {markers
            .filter((marker) => marker.index > 0 && marker.index < coords.length)
            .map((marker) => (
              <g key={marker.key}>
                <line
                  x1={coords[marker.index]!.x}
                  y1={coords[marker.index]!.y}
                  x2={coords[marker.index]!.x}
                  y2={height}
                  stroke="var(--color-line)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={coords[marker.index]!.x}
                  cy={coords[marker.index]!.y}
                  r={4}
                  fill="var(--color-surface)"
                  stroke="var(--chart-debt)"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}

          {/* Where the line starts: today. A ringed dot so it stays visible over the area. */}
          <circle
            cx={coords[0]!.x}
            cy={coords[0]!.y}
            r={4}
            fill="var(--chart-debt)"
            stroke="var(--color-surface)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="h-px w-full bg-ink" />

        {/* One cell per point so each label sits under its own x position, but **not**
            truncated: at 37 points a cell is 27px and "Oct 26" became "O...". The unlabelled
            cells render a hard space, so a label is free to bleed into them. The ends are
            aligned inward rather than centred, which keeps them inside the plot. */}
        <div className="flex">
          {points.map((point, index) => {
            const labelled = index === 0 || index === points.length - 1 || index % labelEvery === 0;
            return (
              <span
                key={`${point.label}-${index}`}
                className={cn(
                  'min-w-0 flex-1 whitespace-nowrap text-micro text-ink-muted',
                  index === 0 ? 'text-left' : index === points.length - 1 ? 'text-right' : 'text-center',
                )}
              >
                {labelled ? point.label : ' '}
              </span>
            );
          })}
        </div>
      </div>

      {markers.length > 0 && (
        <ul className="flex flex-col gap-space-1">
          {markers.map((marker) => (
            <li key={marker.key} className="flex items-baseline gap-space-2 text-caption text-ink-muted">
              <span aria-hidden className="mt-[0.4em] h-[5px] w-[5px] shrink-0 rounded-full border border-[var(--chart-debt)]" />
              {marker.label}
            </li>
          ))}
        </ul>
      )}

      <p id={describedBy} className="sr-only">
        {description} From {first.label} to {last.label}.
      </p>
    </figure>
  );
}
