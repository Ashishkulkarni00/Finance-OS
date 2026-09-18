import { PagePrimer } from '@/components/PagePrimer';

const RULES = [
  { term: 'Saved', means: 'what’s in the account or reservation the goal tracks' },
  { term: 'A month', means: 'what it takes to reach the target by its date' },
  { term: 'Progress', means: 'saved as a share of the target' },
];

/** Goals in one sentence - see `PagePrimer`. */
export function GoalsPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  return (
    <PagePrimer
      storageKey="kosh.goals.primer.dismissed"
      headline="What you’re saving towards, how far you’ve got, and what it takes each month."
      detail="A goal turns “I should save” into a number: how much, by when, and how much a month gets you there."
      rules={RULES}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
