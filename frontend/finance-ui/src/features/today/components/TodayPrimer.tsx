import { PagePrimer } from '@/components/PagePrimer';
import { byId } from '@/features/help/content';
import { termsOf } from '@/features/help/retrofit';

/** Today in one sentence - see `PagePrimer`. Retrofitted from `today.how-today-works`. */
export function TodayPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  const rules = termsOf(byId['today.how-today-works']!, true);
  return (
    <PagePrimer
      storageKey="kosh.today.primer.dismissed"
      headline="What you can spend today without touching money that’s already spoken for."
      // "before salary" alone invites "which salary?" - and this strip sits *above* the hero,
      // so the reader has not yet seen the "Free until salary · 28 Oct" header that would
      // have answered it. The primer has no cycle data of its own; naming which salary is
      // what it can do without plumbing a date through a static strip.
      detail="Bills still due before your next salary are taken out first, so what’s left is genuinely yours."
      rules={rules}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
