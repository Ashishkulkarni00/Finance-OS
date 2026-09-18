import { X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

const FIGURES: { term: string; means: string }[] = [
  { term: 'Put in', means: 'What has gone into a holding — from real entries where it has an account, or what you stated where it doesn’t.' },
  { term: 'Worth', means: 'What you last said it’s worth, from a statement. The one figure you keep up to date by hand.' },
  { term: 'Growth', means: 'Worth minus put in. Only shown once a holding has been valued.' },
];

/** Situations first - the same shape as every other guide. */
const CASES: { question: string; answer: string }[] = [
  {
    question: 'How do I record a SIP instalment?',
    answer:
      'As an Investment from your bank account to the holding’s account. It leaves your spending money without being counted as spending, because you still own it.',
  },
  {
    question: 'Why is no growth shown?',
    answer:
      'Nothing has been valued yet. Tap Value on a holding and enter what your statement says it’s worth — growth appears straight away. A guessed market value would look exact and could be far off.',
  },
  {
    question: 'How often should I add a value?',
    answer: 'Whenever you check a statement — once a quarter is plenty. After three months a value is flagged as worth refreshing.',
  },
  {
    question: 'What does “Growing for later” mean?',
    answer:
      'Money that’s genuinely yours but can’t be reached if you need it — a PF, an NPS, a locked deposit. It’s never counted toward what you can spend.',
  },
  {
    question: 'Why isn’t my NPS or PF in net worth?',
    answer:
      'A holding kept outside your accounts — deducted by an employer, say — has no account balance for net worth to add up. It’s tracked here by what you stated went in.',
  },
  {
    question: 'Is growth on this page the same as returns?',
    answer:
      'It’s simply worth minus put in. It doesn’t account for when each instalment went in, so it isn’t an annual return — just an honest “how much more is there than I put in”.',
  },
];

const ELSEWHERE: { thing: string; where: string }[] = [
  { thing: 'Every contribution you’ve recorded', where: 'Ledger — tap a holding' },
  { thing: 'The balance of the account a SIP leaves from', where: 'Accounts' },
  { thing: 'Whether this month’s SIP has gone out', where: 'Months, if it’s set up as a bill' },
];

interface InvestmentsGuideSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "How Investments works" - the counterpart of every other screen's guide. The questions
 * here are mostly about a figure that isn't shown yet (growth) and why, because that's the
 * gap between what people expect from an investments page and what an honest one can say.
 */
export function InvestmentsGuideSheet({ open, onClose }: InvestmentsGuideSheetProps) {
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
          <p className="mb-space-3 text-label font-medium text-ink">Three figures on a holding</p>
          <div className="rounded-lg border border-line">
            {FIGURES.map((f) => (
              <div
                key={f.term}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-space-3 border-b border-line px-space-4 py-space-3 last:border-b-0"
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
            {CASES.map((c) => (
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
            {ELSEWHERE.map((e) => (
              <div key={e.thing} className="flex items-start gap-space-2 text-caption">
                <X size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
                <span className="text-ink-soft">
                  <span className="text-ink">{e.thing}</span> — {e.where}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
