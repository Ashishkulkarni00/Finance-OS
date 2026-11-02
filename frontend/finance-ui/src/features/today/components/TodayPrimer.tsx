import { PagePrimer } from '@/components/PagePrimer';
import { byId } from '@/features/help/content';
import { termsOf } from '@/features/help/retrofit';

/** Today in one sentence - see `PagePrimer`. Retrofitted from `today.how-today-works`. */
export function TodayPrimer({ onOpenGuide }: { onOpenGuide: () => void }) {
  const rules = termsOf(byId['today.how-today-works']!, true);
  return (
    <PagePrimer
      storageKey="kosh.today.primer.dismissed"
      headline="What’s left of today’s share, and what stands between you and payday."
      // "before salary" alone invites "which salary?" - and this strip sits *above* the hero,
      // so the reader has not yet seen the salary date that would have answered it. The
      // primer has no cycle data of its own; naming which salary is what it can do without
      // plumbing a date through a static strip.
      detail="Bills still due before your next salary are taken out first, then what’s left is spread over the days remaining."
      rules={rules}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
