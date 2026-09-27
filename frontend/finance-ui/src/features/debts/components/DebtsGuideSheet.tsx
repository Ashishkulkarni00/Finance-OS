import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { byId } from '@/features/help/content';
import { termsOf, qaOf, elsewhereOf, fullTopicHref } from '@/features/help/retrofit';

/**
 * "How Debts works" - the counterpart of the Ledger, Today, Months and Accounts guides.
 *
 * <p>Debts is where the product most often declines to show a number - no payoff date, no
 * repaid figure, no interest split - and each refusal reads as missing data unless the
 * reason is one click away.
 *
 * <p><strong>Retrofitted</strong> (IN_APP_MANUAL.md §1, §8): the badges, cases and
 * "elsewhere" list below come from the manual's `loans.how-debts-works` topic.
 */
export function DebtsGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const topic = byId['loans.how-debts-works']!;
  const badges = termsOf(topic);
  const cases = qaOf(topic);
  const elsewhere = elsewhereOf(topic);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How Debts works"
      footer={
        <Button variant="primary" onClick={onClose} className="w-full">
          Got it
        </Button>
      }
    >
      <div className="flex flex-col gap-space-8">
        <p className="text-body text-ink-soft">
          Debts answers <strong className="font-medium text-ink">what you’re paying off, what it costs each month</strong>,
          and when you’ll be free of it. Nothing here is invented: where a real figure hasn’t been supplied, the page
          says so instead of guessing.
        </p>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">The badge on each loan</p>
          <div className="rounded-lg border border-line">
            {badges.map((b) => (
              <div
                key={b.term}
                className="grid grid-cols-[9rem_minmax(0,1fr)] gap-space-3 border-b border-line px-space-4 py-space-3 last:border-b-0"
              >
                <span className="text-label font-medium text-ink">{b.term}</span>
                <span className="text-caption text-ink-muted">{b.means}</span>
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
          <p className="mb-space-3 text-label font-medium text-ink">Not on Debts, on purpose</p>
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
