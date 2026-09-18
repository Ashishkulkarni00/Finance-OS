import { PagePrimer } from '@/components/PagePrimer';

const RULES = [
  { term: 'Available', means: 'what you can actually move from an account' },
  { term: 'Net worth', means: 'everything you own minus everything you owe' },
  { term: 'Needs a look', means: 'an account problem worth fixing' },
];

/** Accounts in one sentence - see `PagePrimer`. */
export function AccountsPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  return (
    <PagePrimer
      storageKey="kosh.accounts.primer.dismissed"
      headline="What you own, what you owe, and what each account can actually do for you."
      detail="A balance isn’t always yours to move — a bank minimum or money set aside can hold part of it back."
      rules={RULES}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
