import { PagePrimer } from '@/components/PagePrimer';

const RULES = [
  { term: 'Free until salary', means: 'held − reserved − bills still due − owed on credit cards' },
  { term: 'A day', means: 'that, spread over the days to salary' },
  { term: 'Needs you', means: 'act on it now' },
];

/** Today in one sentence - see `PagePrimer`. */
export function TodayPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  return (
    <PagePrimer
      storageKey="kosh.today.primer.dismissed"
      headline="What you can spend today without touching money that’s already spoken for."
      detail="Bills still due before salary are taken out first, so what’s left is genuinely yours."
      rules={RULES}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
