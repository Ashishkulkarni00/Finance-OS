import { PagePrimer } from '@/components/PagePrimer';

const RULES = [
  { term: 'Free this cycle', means: 'yours after every bill still due' },
  { term: 'Needs you', means: 'overdue, due in 2 days, or missing an amount' },
  { term: 'Settle', means: 'record that you paid it' },
];

/** Months in one sentence - see `PagePrimer`. */
export function MonthPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  return (
    <PagePrimer
      storageKey="kosh.month.primer.dismissed"
      headline="Every salary month in one place — plan the ones ahead, run this one, look back on the last."
      detail="Bills that need you come first. Paid ones stay listed, so nothing quietly disappears."
      rules={RULES}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
