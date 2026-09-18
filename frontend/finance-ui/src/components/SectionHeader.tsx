import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SectionHeaderProps {
  children: ReactNode;
  /** Right-hand side: a count, a "this cycle" qualifier, an action. */
  trailing?: ReactNode;
  /** Drop the hairline. For sections whose first element is itself a horizontal rule -
   *  two stacked lines read as a mistake. Opt out here rather than passing a
   *  `border-b-0`: `cn` is a plain joiner, so the two width utilities would be resolved
   *  by stylesheet order rather than by what the caller meant. */
  rule?: boolean;
  className?: string;
}

/**
 * Anchors a section the way the spreadsheet's header bands do - a micro label and a
 * hairline that runs the full measure. Structure, not decoration: without it, sections
 * float in whitespace and the page reads flat (DESIGN_SYSTEM §1, the failure mode).
 */
export function SectionHeader({ children, trailing, rule = true, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-space-3 flex items-baseline justify-between gap-space-4',
        rule && 'border-b border-ink pb-space-2',
        className,
      )}
    >
      <span className="text-micro uppercase tracking-[0.08em] text-ink">{children}</span>
      {trailing && <span className="text-caption text-ink-muted">{trailing}</span>}
    </div>
  );
}
