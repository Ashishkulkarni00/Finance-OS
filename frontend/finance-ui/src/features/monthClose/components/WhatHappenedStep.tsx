import { NumberDisplay } from '@/components/NumberDisplay';
import { Skeleton } from '@/components/Skeleton';
import { formatMoney } from '@/lib/money';
import type { CycleSummaryResponse } from '@/types/cycle';

interface WhatHappenedStepProps {
  summary: CycleSummaryResponse | undefined;
  isLoading: boolean;
}

/** Step 3 - the sentence, then the numbers behind it. SCREEN_SPECS S6. */
export function WhatHappenedStep({ summary, isLoading }: WhatHappenedStepProps) {
  if (isLoading || !summary) {
    return (
      <div className="flex flex-col gap-space-6">
        <Skeleton className="h-9 w-3/4" />
        <div className="grid grid-cols-3 gap-space-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-6">
      <h1 className="text-editorial font-serif text-ink">
        You brought in {formatMoney(summary.incomeTotal)}, spent {formatMoney(summary.expenseTotal)}, and kept{' '}
        {formatMoney(summary.net)}.
      </h1>
      <div className="grid grid-cols-3 gap-space-6">
        <NumberDisplay label="In" value={summary.incomeTotal} role="section" />
        <NumberDisplay label="Out" value={summary.expenseTotal} role="section" />
        <NumberDisplay label="Saved" value={summary.net} role="section" />
      </div>
    </div>
  );
}
