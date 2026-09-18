import { X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

/** How a bill is sorted. Stated as the rule the server applies (AttentionTier.java), so
 *  "why is this one in Needs you?" has an answer that matches the screen exactly. */
const TIERS: { name: string; rule: string }[] = [
  { name: 'Needs you', rule: 'Overdue, due within 2 days, missing an amount, or flagged for a second look. Act on these.' },
  { name: 'Still to come', rule: 'Due later this cycle. Nothing to do yet — just no surprises.' },
  { name: 'Settled', rule: 'Paid. Stays listed so you can see what went out, and whether it cost more than planned.' },
];

/** Situations first - the questions the page raises, the same shape as the Ledger and
 *  Today guides. The first one is a real case from this product's own data: a bill
 *  added mid-cycle that "isn't there". */
const CASES: { question: string; answer: string }[] = [
  {
    question: 'Can I plan next month?',
    answer:
      'Yes. Use the arrows beside the month name to move to it, then add a bill — it starts in the month you’re viewing, or pick another under “Starts”. What’s free for a month only appears once it starts, because it depends on your balances then.',
  },
  {
    question: 'How do I look back at a past month?',
    answer:
      'Use the left arrow. You’ll see how the plan went — what was paid against what was planned, anything left unpaid — and what actually came in and went out.',
  },
  {
    question: 'A bill only runs for a few months',
    answer: 'Choose its last month under “Runs until” when you add it. It stops appearing after that month.',
  },
  {
    question: 'I added a bill late — after its due date this month',
    answer:
      'It still counts for this month and is listed under “Due date passed”. If the payment is already in your Ledger on the same account, within a few days of the due date and for the same amount, it’s linked automatically and shows as settled. Otherwise, Settle it and choose “Already in the Ledger” — never record it again, or the money is counted twice. (Only pick “Starts from its next due date” when adding a bill that genuinely hadn’t started yet.)',
  },
  {
    question: 'How is “Free for the rest of this cycle” different from Room left on Today?',
    answer: 'It’s the same money. Months shows the whole amount until salary; Today splits it into a share per day.',
  },
  {
    question: 'A bill says “Amount unknown”',
    answer:
      'It changes every month, like electricity. Give it an estimate — until you do, what’s free can’t be worked out and shows “—”.',
  },
  {
    question: 'What’s the difference between Estimate and Settle?',
    answer:
      'Estimate only says roughly how much a bill will be. Settle records that you actually paid it, and the payment appears in the Ledger.',
  },
  {
    question: '“₹350 more than planned”',
    answer: 'The bill was settled for more than its expected amount. It’s information, not a warning.',
  },
  {
    question: '“Where day-to-day money went” is much smaller than Money out',
    answer:
      'Money out is every expense this cycle. The day-to-day section is only the flexible categories — groceries, eating out, transport — not bills, EMIs or one-offs. It shows what that money was made of, so you can see which category is taking most of it.',
  },
  {
    question: 'Why is there no budget?',
    answer:
      'A number picked on a good day is easy to miss and then abandon. Once a few cycles have closed, spending is compared with your own usual instead.',
  },
];

const ELSEWHERE: { thing: string; where: string }[] = [
  { thing: 'What you can spend today', where: 'Today' },
  { thing: 'Every entry behind these totals', where: 'Ledger' },
  { thing: 'Account balances and net worth', where: 'Accounts' },
  { thing: 'Changing a bill’s amount, due day or account for every month', where: 'the bill’s own page — open it from the plan' },
  { thing: 'Loans and what’s left on them', where: 'Debts' },
];

interface MonthGuideSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "How Months works" - the counterpart of the Ledger and Today guides.
 *
 * <p>Month asks the most of its reader of the three: a verdict, three tiers of bills,
 * two kinds of action and two spending totals that don't match. Each of those is a
 * reasonable thing to be confused by, and each has a one-sentence answer.
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
          For whichever salary month you’re on, Months answers <strong className="font-medium text-ink">what still has to happen before salary</strong>, and
          whether the plan is holding. The month here runs salary to salary, not 1st to 31st.
        </p>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">How bills are sorted</p>
          <div className="rounded-lg border border-line">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-space-3 border-b border-line px-space-4 py-space-3 last:border-b-0"
              >
                <span className="text-label font-medium text-ink">{t.name}</span>
                <span className="text-caption text-ink-muted">{t.rule}</span>
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
          <p className="mb-space-3 text-label font-medium text-ink">Not on Months, on purpose</p>
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
