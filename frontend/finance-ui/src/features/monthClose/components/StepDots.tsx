import { cn } from '@/lib/cn';

interface StepDotsProps {
  count: number;
  current: number;
}

/** Quiet progress indicator for the Month Close wizard - dots, not a percentage. */
export function StepDots({ count, current }: StepDotsProps) {
  return (
    <div className="flex items-center gap-space-2" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={count}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn('h-[3px] w-8 rounded-full transition-colors duration-150', i <= current ? 'bg-accent' : 'bg-line')}
        />
      ))}
    </div>
  );
}
