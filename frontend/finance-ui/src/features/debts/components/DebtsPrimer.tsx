import { PagePrimer } from '@/components/PagePrimer';

const RULES = [
  { term: 'Leaving every month', means: 'EMIs debited straight from a bank account' },
  { term: 'Billed to a card', means: 'EMIs inside a card bill — never added twice' },
  { term: 'Terms not supplied', means: 'no payoff date until the real figures are in' },
];

/** Debts in one sentence - see `PagePrimer`. */
export function DebtsPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  return (
    <PagePrimer
      storageKey="kosh.debts.primer.dismissed"
      headline="Every loan you’re paying off, what leaves each month, and when you’re free of it."
      detail="Only what’s actually known is shown — a loan without its real terms gets no invented payoff date."
      rules={RULES}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
