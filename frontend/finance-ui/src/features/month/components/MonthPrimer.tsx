import { PagePrimer } from '@/components/PagePrimer';
import { byId } from '@/features/help/content';
import { termsOf } from '@/features/help/retrofit';

/** Months in one sentence - see `PagePrimer`. Retrofitted from `months.how-months-works`. */
export function MonthPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  const rules = termsOf(byId['months.how-months-works']!, true);
  return (
    <PagePrimer
      storageKey="kosh.month.primer.dismissed"
      headline="One month, salary to salary: what still has to be paid before your next salary, and what’s free after it."
      detail="Add each rent, EMI, bill or salary once as a commitment - it then shows up in every month it applies to."
      rules={rules}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
