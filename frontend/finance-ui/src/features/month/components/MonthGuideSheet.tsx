import { ArrowRight } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

/** The words the page uses, each in one plain sentence. */
const TERMS: { name: string; means: string }[] = [
  {
    name: 'Commitment',
    means: 'Anything with a known date each month (or just once): rent, an EMI, a SIP, a bill, family support - and your salary coming in.',
  },
  { name: 'Free until salary', means: 'What’s left in your accounts after every commitment still due before your next salary.' },
  { name: 'Settle', means: 'Mark one as paid. It records the payment in your Ledger. For income it’s “Received”.' },
  {
    name: 'Amount unknown',
    means: 'One that changes each month, like electricity, with no number yet. Until it has one, “Free until salary” shows “—” rather than a guess.',
  },
  { name: 'Estimate', means: 'Give an “amount unknown” one a rough number. Nothing is marked paid.' },
];

/** What each field of "Add a commitment" asks, in the order the form asks it. */
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

/** The questions the page actually raises, answered in one or two sentences each. */
const CASES: { question: string; answer: string }[] = [
  {
    question: 'Why does a month run 28 Sep to 27 Oct?',
    answer:
      'Months here run from one salary to the next, not 1st to 31st - so a month is exactly the money one salary has to cover. It’s named for the month it ends in.',
  },
  {
    question: 'Can I plan next month?',
    answer:
      'Yes. Use the arrow beside the month name to move ahead, then add a commitment - its first payment is set to the month you’re looking at.',
  },
  {
    question: 'I added one after its due date had passed',
    answer:
      'It still counts this month, under “Due date passed”. If you already paid it and the payment is in your Ledger, Settle it and choose “Already in the Ledger” - don’t record it again, or it’s counted twice.',
  },
  {
    question: 'Its amount is different just this once',
    answer:
      'For one that changes each month, click the pencil and set “This time” - only that month changes. To change it for every month, edit its Amount instead.',
  },
  {
    question: '“₹350 more than planned”',
    answer: 'It was settled for more than expected. Just information, not a warning.',
  },
  {
    question: 'Why is there no budget?',
    answer:
      'A number picked on a good day is easy to miss and then give up on. After a few months, your spending is compared with your own usual instead.',
  },
];

const ELSEWHERE: { thing: string; where: string }[] = [
  { thing: 'What you can spend today', where: 'Today' },
  { thing: 'Every payment behind these totals', where: 'Ledger' },
  { thing: 'Account balances', where: 'Accounts' },
  { thing: 'Loans and what’s left on them', where: 'Debts' },
];

interface MonthGuideSheetProps {
  open: boolean;
  onClose: () => void;
}

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
 * asks, and the questions people actually hit. Kept to what's on screen today: a guide that
 * names a field the form no longer has is worse than no guide.
 */
export function MonthGuideSheet({ open, onClose }: MonthGuideSheetProps) {
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
          <Table rows={TERMS} />
        </div>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">Adding a commitment</p>
          <Table rows={FIELDS} />
          <p className="mt-space-2 text-caption text-ink-muted">Every field also has an ⓘ beside it with the same explanation.</p>
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
                <ArrowRight size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
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
