import { PagePrimer } from '@/components/PagePrimer';
import { byId } from '@/features/help/content';
import { termsOf } from '@/features/help/retrofit';

/** Accounts in one sentence - see `PagePrimer`. Retrofitted: its three rules come from
 *  `accounts.how-accounts-works`'s terms block (the ones marked `primer: true`), not a
 *  local array - IN_APP_MANUAL.md §1, §8. */
export function AccountsPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  const rules = termsOf(byId['accounts.how-accounts-works']!, true);
  return (
    <PagePrimer
      storageKey="kosh.accounts.primer.dismissed"
      headline="What you own, what you owe, and what each account can actually do for you."
      detail="A balance isn’t always yours to move — a bank minimum or money set aside can hold part of it back."
      rules={rules}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
