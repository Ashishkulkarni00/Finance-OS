import { cn } from '@/lib/cn';

interface ProgressRuleProps {
  /** 0 to 1. Clamped here so a caller can pass a raw ratio without guarding it. */
  fraction: number;
  className?: string;
}

/**
 * A hairline with a marker on it - how far through something you are.
 *
 * <p>Deliberately not a filled pill. At 2px with a small dot it reads as an instrument's
 * scale; at 4px and rounded it reads as a loading bar, which is a different promise. The
 * cycle band and the plan's settled-progress share this so the two can't drift into
 * looking like unrelated kinds of thing on the same screen.
 */
export function ProgressRule({ fraction, className }: ProgressRuleProps) {
  const percent = Math.min(1, Math.max(0, fraction)) * 100;

  return (
    <div className={cn('relative h-[2px] w-full bg-line', className)}>
      <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
      <span
        aria-hidden
        className="absolute top-1/2 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
        style={{ left: `${percent}%` }}
      />
    </div>
  );
}
