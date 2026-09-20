import { PagePrimer } from '@/components/PagePrimer';

const RULES = [
  { term: 'Free until salary', means: 'what’s left after everything still due' },
  { term: 'Settle', means: 'mark it paid' },
  { term: 'Estimate', means: 'give a changing one a rough amount' },
];

/** Months in one sentence - see `PagePrimer`. */
export function MonthPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  return (
    <PagePrimer
      storageKey="kosh.month.primer.dismissed"
      headline="One month, salary to salary: what still has to be paid before your next salary, and what’s free after it."
      detail="Add each rent, EMI, bill or salary once as a commitment - it then shows up in every month it applies to."
      rules={RULES}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
