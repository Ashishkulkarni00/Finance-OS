import { cn } from '@/lib/cn';

/** Matches final layout dimensions - never a spinner, especially never over a hero number. DESIGN_SYSTEM §7. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-sunken', className)} />;
}
