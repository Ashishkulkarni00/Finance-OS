import { PagePrimer } from '@/components/PagePrimer';
import { byId } from '@/features/help/content';
import { termsOf } from '@/features/help/retrofit';

/** Debts in one sentence - see `PagePrimer`. Retrofitted from `loans.how-debts-works`. */
export function DebtsPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  const rules = termsOf(byId['loans.how-debts-works']!, true);
  return (
    <PagePrimer
      storageKey="kosh.debts.primer.dismissed"
      headline="Every loan you’re paying off, what leaves each month, and when you’re free of it."
      detail="Only what’s actually known is shown — a loan without its real terms gets no invented payoff date."
      rules={rules}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
