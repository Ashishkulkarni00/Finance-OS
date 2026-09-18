import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface RowProps {
  domainRule?: 'commit' | 'goal' | 'debt' | 'invest';
  primary: ReactNode;
  secondary?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
}

/** The workhorse for commitments and transactions. 48px, three zones. DESIGN_SYSTEM §6. */
export function Row({ domainRule, primary, secondary, trailing, onClick }: RowProps) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={cn(
        'flex w-full min-h-12 items-center gap-space-4 border-b border-line py-space-2 text-left last:border-b-0',
        onClick && 'hover:bg-sunken transition-colors duration-150 rounded-lg px-space-2 -mx-space-2',
      )}
    >
      {domainRule && <span aria-hidden className="h-8 w-[3px] shrink-0 rounded-full" style={{ background: `var(--${domainRule})` }} />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-row text-ink">{primary}</div>
        {secondary && <div className="truncate text-caption text-ink-muted">{secondary}</div>}
      </div>
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
    </Wrapper>
  );
}
