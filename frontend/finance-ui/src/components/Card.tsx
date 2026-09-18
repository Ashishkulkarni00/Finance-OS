import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** A 3px leading rule in a domain hue - identity, not decoration. See DESIGN_SYSTEM §6. */
  domainRule?: 'commit' | 'goal' | 'debt' | 'invest';
}

/** `--surface`, radius 12, 1px `--line`. No shadow by default - DESIGN_SYSTEM §6. */
export function Card({ children, domainRule, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-line bg-surface p-space-5',
        domainRule && 'pl-[calc(var(--spacing-space-5)+3px)]',
        className,
      )}
      {...rest}
    >
      {domainRule && (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl"
          style={{ background: `var(--${domainRule})` }}
        />
      )}
      {children}
    </div>
  );
}
