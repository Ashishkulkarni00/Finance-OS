import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { byId } from '@/features/help/content';
import { termsOf, qaOf, elsewhereOf, fullTopicHref } from '@/features/help/retrofit';

/**
 * "How Accounts works" - the counterpart of the Ledger, Today and Months guides.
 *
 * <p>Accounts is where two numbers that look like they should agree most often don't:
 * a balance and what's available, net worth and what feels like "mine". Every one of
 * those gaps has a one-sentence reason.
 *
 * <p><strong>Retrofitted</strong> (IN_APP_MANUAL.md §1, §8): the figures, cases and
 * "elsewhere" list below are no longer hardcoded here - they are read from the manual's
 * `accounts.how-accounts-works` topic, so this sheet and the full manual page can never
 * say something different about the same question.
 */
export function AccountsGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const topic = byId['accounts.how-accounts-works']!;
  const figures = termsOf(topic);
  const cases = qaOf(topic);
  const elsewhere = elsewhereOf(topic);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How Accounts works"
      footer={
        <Button variant="primary" onClick={onClose} className="w-full">
          Got it
        </Button>
      }
    >
      <div className="flex flex-col gap-space-8">
        <p className="text-body text-ink-soft">
          Accounts answers <strong className="font-medium text-ink">what you own, what you owe</strong>, and what each
          account can actually do for you right now. It explains money; it never moves it.
        </p>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">Words you’ll see</p>
          <div className="rounded-lg border border-line">
            {figures.map((f) => (
              <div
                key={f.term}
                className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-space-3 border-b border-line px-space-4 py-space-3 last:border-b-0"
              >
                <span className="text-label font-medium text-ink">{f.term}</span>
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
          <p className="mb-space-3 text-label font-medium text-ink">Not on Accounts, on purpose</p>
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
