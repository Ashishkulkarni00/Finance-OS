import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { byId } from '@/features/help/content';
import { termsOf, qaOf, elsewhereOf, fullTopicHref } from '@/features/help/retrofit';

/**
 * "How Investments works" - the counterpart of every other screen's guide. The questions
 * here are mostly about a figure that isn't shown yet (growth) and why, because that's the
 * gap between what people expect from an investments page and what an honest one can say.
 *
 * <p><strong>Retrofitted</strong> (IN_APP_MANUAL.md §1, §8) from
 * `investments.how-investments-works`.
 */
export function InvestmentsGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const topic = byId['investments.how-investments-works']!;
  const figures = termsOf(topic);
  const cases = qaOf(topic);
  const elsewhere = elsewhereOf(topic);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How Investments works"
      footer={
        <Button variant="primary" onClick={onClose} className="w-full">
          Got it
        </Button>
      }
    >
      <div className="flex flex-col gap-space-8">
        <p className="text-body text-ink-soft">
          Investments answers <strong className="font-medium text-ink">how much you’ve put to work, where it is</strong>, and
          how it’s growing. What went in is always known; what it’s worth is whatever you last told it.
        </p>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">Words you’ll see</p>
          <div className="rounded-lg border border-line">
            {figures.map((f) => (
              <div
                key={f.term}
                className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-space-3 border-b border-line px-space-4 py-space-3 last:border-b-0"
              >
                <span className="text-label font-medium text-invest">{f.term}</span>
                <span className="text-caption text-ink-muted">{f.means}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">If you’re wondering…</p>
          <div className="rounded-lg border border-line">
            {cases.map((c) => (
              <div key={c.question} className="border-b border-line px-space-4 py-space-3 last:border-b-0">
                <p className="text-label text-ink">{c.question}</p>
                <p className="mt-space-1 text-caption text-ink-muted">{c.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">Elsewhere</p>
          <div className="flex flex-col gap-space-2">
            {elsewhere.map((e) => (
              <div key={e.thing} className="flex items-start gap-space-2 text-caption">
                <X size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
                <span className="text-ink-soft">
                  <span className="text-ink">{e.thing}</span> — {e.where}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Link
          to={fullTopicHref(topic)}
          onClick={onClose}
          className="text-caption text-accent underline-offset-2 hover:underline"
        >
          Read the full guide in the manual
        </Link>
      </div>
    </Modal>
  );
}
