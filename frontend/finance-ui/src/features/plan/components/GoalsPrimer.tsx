import { PagePrimer } from '@/components/PagePrimer';
import { byId } from '@/features/help/content';
import { termsOf } from '@/features/help/retrofit';

/** Goals in one sentence - see `PagePrimer`. Retrofitted from `goals.how-goals-works`. */
export function GoalsPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  const rules = termsOf(byId['goals.how-goals-works']!, true);
  return (
    <PagePrimer
      storageKey="kosh.goals.primer.dismissed"
      headline="What you’re saving towards, how far you’ve got, and what it takes each month."
      detail="A goal turns “I should save” into a number: how much, by when, and how much a month gets you there."
      rules={rules}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
