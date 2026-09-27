import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { byId } from '@/features/help/content';
import { termsOf, qaOf, elsewhereOf, fullTopicHref } from '@/features/help/retrofit';

/** What each field of "Add a commitment" asks, in the order the form asks it. Kept local
 *  (rather than read from the manual) because it's a condensed reference table, not a
 *  restatement of anything - the full field docs live in the manual's
 *  `monthly-plan.adding-a-commitment` topic, one click away via "Read the full guide". */
const FIELDS: { name: string; means: string }[] = [
  {
    name: 'Type',
    means: 'Payment for money that leaves you (rent, EMIs, bills). Saving for money moved into your own savings account. Investing for a SIP or RD. Income for your salary.',
  },
  {
    name: 'Amount',
    means: 'Fixed if it’s the same every time. Changes each month if not - you can enter the first one straight away, and each later one when you know it.',
  },
  { name: 'Due on', means: 'The day of the month it’s paid.' },
  {
    name: 'First payment',
    means: 'The month of the first one; the exact date is shown beside it. Pick an earlier month if it’s already been running.',
  },
  { name: 'Last payment', means: 'Only if it ends, like your final EMI. Otherwise leave it as “No end”.' },
  { name: 'Must pay?', means: 'Yes if missing it costs you (a fee, a penalty). No if you could skip it in a tight month.' },
];

function Table({ rows }: { rows: { name: string; means: string }[] }) {
  return (
    <div className="rounded-lg border border-line">
      {rows.map((r) => (
        <div key={r.name} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-space-3 border-b border-line px-space-4 py-space-3 last:border-b-0">
          <span className="text-label font-medium text-ink">{r.name}</span>
          <span className="text-caption text-ink-muted">{r.means}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * "How Months works" - what the page is for, the words it uses, what adding a commitment
 * asks, and the questions people actually hit.
 *
 * <p><strong>Retrofitted</strong> (IN_APP_MANUAL.md §1, §8): "Words you'll see", the
 * cases and "Elsewhere" come from the manual's `months.how-months-works` topic.
 */
export function MonthGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const topic = byId['months.how-months-works']!;
  const terms = termsOf(topic);
  const cases = qaOf(topic);
  const elsewhere = elsewhereOf(topic);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How Months works"
      footer={
        <Button variant="primary" onClick={onClose} className="w-full">
          Got it
        </Button>
      }
    >
      <div className="flex flex-col gap-space-8">
        <p className="text-body text-ink-soft">
          Months shows one month at a time, from one salary to the next. It answers two questions:{' '}
          <strong className="font-medium text-ink">what still has to be paid before your next salary</strong>, and{' '}
          <strong className="font-medium text-ink">how much is free after that</strong>. Everything you pay (or receive)
          regularly is a commitment - add each one once, and it appears in every month it applies to.
        </p>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">Words you’ll see</p>
          <Table rows={terms.map((t) => ({ name: t.term, means: t.means }))} />
        </div>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">Adding a commitment</p>
          <Table rows={FIELDS} />
          <p className="mt-space-2 text-caption text-ink-muted">Every field also has an ⓘ beside it with the same explanation.</p>
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
                <ArrowRight size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
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
