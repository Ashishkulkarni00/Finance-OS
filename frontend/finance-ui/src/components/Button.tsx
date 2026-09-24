import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'sm';
  children: ReactNode;
}

/**
 * Primary (accent fill), Secondary (border), Ghost (text). One primary per screen.
 * Height 44 desktop / 48 mobile - see DESIGN_SYSTEM.md §6.
 */
export function Button({ variant = 'secondary', size = 'default', className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'pressable inline-flex items-center justify-center gap-space-2 rounded-lg text-label font-medium transition-[colors,transform] duration-150 disabled:opacity-40 disabled:pointer-events-none',
        size === 'default' ? 'h-11 px-space-5' : 'h-9 px-space-4 text-caption',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent-hover',
        variant === 'secondary' && 'border border-border text-ink bg-surface hover:bg-sunken',
        variant === 'ghost' && 'text-ink-soft hover:bg-sunken hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
