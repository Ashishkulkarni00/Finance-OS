import { PagePrimer } from '@/components/PagePrimer';

const RULES = [
  { term: 'Put to work', means: 'everything you’ve invested so far' },
  { term: 'Value', means: 'what a holding is worth — add it from your statement' },
  { term: 'Growing for later', means: 'invested, but not money you could reach' },
];

/** Investments in one sentence - see `PagePrimer`. */
export function InvestmentsPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  return (
    <PagePrimer
      storageKey="kosh.investments.primer.dismissed"
      headline="Money you’ve put to work, where it’s put, and how it’s growing."
      detail="Growth is shown once you add what your holdings are worth — nothing here guesses a market value."
      rules={RULES}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
