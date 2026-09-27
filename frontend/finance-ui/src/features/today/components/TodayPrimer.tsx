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
      detail="Bills still due before salary are taken out first, so what’s left is genuinely yours."
      rules={rules}
      guideLabel="How it works"
      onOpenGuide={onOpenGuide}
    />
  );
}
