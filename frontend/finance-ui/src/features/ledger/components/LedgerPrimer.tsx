import { PagePrimer } from '@/components/PagePrimer';
import { byId } from '@/features/help/content';
import { termsOf } from '@/features/help/retrofit';

/** The Ledger's "what goes here" - see `PagePrimer` for why it's on the page at all.
 *  Retrofitted from `spending.how-the-ledger-works`. */
export function LedgerPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  const rules = termsOf(byId['spending.how-the-ledger-works']!, true);
  return (
    <PagePrimer
      storageKey="kosh.ledger.primer.dismissed"
      headline="Every time money actually moved — once each, on the day it moved."
      detail="Nothing that hasn't happened yet: a bill that is due lives on Months until you pay it."
      rules={rules}
      guideLabel="All the cases"
      onOpenGuide={onOpenGuide}
    />
  );
}
