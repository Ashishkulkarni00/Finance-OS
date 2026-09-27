import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { byId } from '@/features/help/content';
import { termsOf, qaOf, elsewhereOf, fullTopicHref } from '@/features/help/retrofit';

/**
 * "How Today works" - the Today counterpart of `LedgerGuideSheet`.
 *
 * <p>Today is judged by one figure, and a figure people don't understand is a figure
 * they second-guess against their banking app - at which point the product has stopped
 * doing its job. The page shows the derivation (Where you stand) but not *why it moved*,
 * which is the question that actually comes up.
 *
 * <p><strong>Retrofitted</strong> (IN_APP_MANUAL.md §1, §8) from `today.how-today-works`.
 */
export function TodayGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const topic = byId['today.how-today-works']!;
  // "Needs you" lives in the same terms block for the primer's sake (§8's retrofit: "a
  // primer's term -> means pairs come from the topic's terms block") but isn't part of
  // the derivation chain itself - the manual's own page shows it in context instead.
  const chain = termsOf(topic).filter((t) => t.term !== 'Needs you');
  const cases = qaOf(topic);
  const elsewhere = elsewhereOf(topic);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How Today works"
      footer={
        <Button variant="primary" onClick={onClose} className="w-full">
          Got it
        </Button>
      }
    >
      <div className="flex flex-col gap-space-8">
        <p className="text-body text-ink-soft">
          Today answers one question: <strong className="font-medium text-ink">what can I spend today</strong> without
          touching money that’s already spoken for - and warns you before anything goes wrong.
        </p>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">Where “Free until salary” comes from</p>
          <div className="rounded-lg border border-line">
            {chain.map((c) => (
              <div
                key={c.term}
                className="grid grid-cols-[9rem_minmax(0,1fr)] gap-space-3 border-b border-line px-space-4 py-space-2 last:border-b-0"
              >
                <span className={c.term.startsWith('=') ? 'text-label font-medium text-accent' : 'text-label text-ink'}>
                  {c.term}
                </span>
                <span className="text-caption text-ink-muted">{c.means}</span>
              </div>
            ))}
          </div>
          <p className="mt-space-2 text-caption text-ink-muted">
            What you’ve spent today comes off today’s share - that’s “left today”. Credit cards, loans and
            investments are never counted as spending money.
          </p>
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
          <p className="mb-space-3 text-label font-medium text-ink">Not on Today, on purpose</p>
          <p className="mb-space-3 text-caption text-ink-muted">
            Today is the next 24 hours. It shows what needs you now and the next few things due - never the full
            list.
          </p>
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
