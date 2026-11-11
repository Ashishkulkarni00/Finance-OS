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
  /** The section's body is a phone card (`.m-card`): on a phone the title sits above the card
   *  with no hairline of its own - the card's edge is the structure there. Wide screens keep
   *  the rule. */
  overCard?: boolean;
  className?: string;
}

/**
 * Anchors a section the way the spreadsheet's header bands do - a sentence-case title (v3;
 * it was an uppercase micro label) and a quiet hairline that runs the full measure. Structure, not decoration: without it, sections
 * float in whitespace and the page reads flat (DESIGN_SYSTEM §1, the failure mode).
 */
export function SectionHeader({ children, trailing, rule = true, overCard = false, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'section-header mb-space-3 flex flex-wrap items-baseline justify-between gap-x-space-4 gap-y-space-1',
        rule && (overCard ? 'md:border-b md:border-line md:pb-space-2' : 'border-b border-line pb-space-2'),
        overCard && 'max-md:mb-space-2',
        className,
      )}
    >
      <h2 className="shrink-0 text-sectiontitle text-ink">{children}</h2>
      {trailing && <span className="text-caption text-ink-muted">{trailing}</span>}
    </div>
  );
}
