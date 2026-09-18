import { PagePrimer } from '@/components/PagePrimer';

const RULES = [
  { term: 'Room left', means: 'your share for today' },
  { term: 'Real balance', means: 'held − reserved − bills still due − owed on credit cards' },
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
