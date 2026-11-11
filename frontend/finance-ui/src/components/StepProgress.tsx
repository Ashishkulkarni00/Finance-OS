import { cn } from '@/lib/cn';

/**
 * Where the user is in a short, fixed flow (onboarding, closing a month) - UI_UX_REVAMP_PLAN 4.6, 4.11.
 * Named steps, not anonymous dots: "Step 2 of 5 · Review" tells you what you are in and what is left.
 *
 * <p>From a tablet up the names sit in a row with the finished ones quiet; on a phone it is the one
 * current name above a thin bar (five names do not fit across 390px).
 */
export function StepProgress({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <div role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={steps.length} aria-valuetext={`Step ${current + 1} of ${steps.length}: ${steps[current]}`} className="flex flex-col gap-space-2">
      <p className="num text-caption text-ink-muted md:hidden">
        Step {current + 1} of {steps.length} · <span className="text-ink">{steps[current]}</span>
      </p>
      <ol className="hidden items-center gap-space-4 md:flex">
        {steps.map((name, i) => (
          <li
            key={name}
            aria-current={i === current ? 'step' : undefined}
            className={cn(
              'text-caption',
              i === current ? 'font-medium text-ink' : i < current ? 'text-ink-muted' : 'text-ink-muted/60',
            )}
          >
            <span className="num mr-space-1">{i + 1}</span>
            {name}
          </li>
        ))}
      </ol>
      <div className="flex gap-space-1" aria-hidden>
        {steps.map((name, i) => (
          <span key={name} className={cn('h-[3px] flex-1 rounded-full transition-colors duration-150', i <= current ? 'bg-accent' : 'bg-line')} />
        ))}
      </div>
    </div>
  );
}
