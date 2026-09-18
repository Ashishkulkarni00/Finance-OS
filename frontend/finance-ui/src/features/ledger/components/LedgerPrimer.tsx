import { PagePrimer } from '@/components/PagePrimer';

/** The three that account for almost every miscount: a card swipe and its bill payment,
 *  a withdrawal and the cash spend. Short enough to read without deciding to. */
const RULES = [
  { term: 'Card swipe', means: 'Expense, on the day you swiped' },
  { term: 'Card bill paid', means: 'Transfer — already counted at the swipe' },
  { term: 'Cash withdrawn', means: 'Transfer — spent only when you spend it' },
];

/** The Ledger's "what goes here" - see `PagePrimer` for why it's on the page at all. */
export function LedgerPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  return (
    <PagePrimer
      storageKey="kosh.ledger.primer.dismissed"
      headline="Every time money actually moved — once each, on the day it moved."
      detail="Nothing that hasn't happened yet: a bill that is due lives on Months until you pay it."
      rules={RULES}
      guideLabel="All the cases"
      onOpenGuide={onOpenGuide}
    />
  );
}
