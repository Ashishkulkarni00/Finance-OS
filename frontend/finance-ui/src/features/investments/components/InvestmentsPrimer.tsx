import { PagePrimer } from '@/components/PagePrimer';
import { byId } from '@/features/help/content';
import { termsOf } from '@/features/help/retrofit';

/** Investments in one sentence - see `PagePrimer`. Retrofitted from
 *  `investments.how-investments-works`. */
export function InvestmentsPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  const rules = termsOf(byId['investments.how-investments-works']!, true);
  return (
    <PagePrimer
      storageKey="kosh.investments.primer.dismissed"
      headline="Money you’ve put to work, where it’s put, and how it’s growing."
      detail="Growth is shown once you add what your holdings are worth — nothing here guesses a market value."
      rules={rules}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
