import { X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

/** The badge on a loan row, and what it changes about the figures beside it. */
const BADGES: { label: string; means: string }[] = [
  { label: 'Confirmed', means: 'Terms taken from the sanction letter or a statement. Every figure is derived.' },
  { label: 'Estimated', means: 'Worked out from what you entered, not paperwork. Close, not exact.' },
  {
    label: 'Terms not supplied',
    means: 'No interest rate yet. The EMI and payments left are known; the payoff date and amount repaid aren’t shown.',
  },
  { label: 'Payment unverified', means: 'A payment we couldn’t confirm left. Counted as still owed until you confirm it.' },
];

/** Situations first - the questions this page raises, the same shape as the other guides. */
const CASES: { question: string; answer: string }[] = [
  {
    question: 'How do I record an EMI I’ve paid?',
    answer:
      'As an Expense from the bank account it left, in the Loan EMI category — or Settle it from Months if it’s set up as a bill there. Not as a transfer to the loan.',
  },
  {
    question: 'How do I record paying extra towards a loan?',
    answer: 'As a Transfer from your bank account to the loan account. That’s a prepayment, and it reduces what you owe.',
  },
  {
    question: 'Why isn’t the card EMI added to what leaves every month?',
    answer:
      'It arrives inside your card bill, and paying the card bill is already how that money leaves. Adding it again would count the same money twice.',
  },
  {
    question: 'Why is there no payoff date?',
    answer:
      'The loan has no interest rate recorded. A payoff date worked out from a guessed rate would look exact and be wrong, so none is shown. Add the rate from the sanction letter and it appears.',
  },
  {
    question: 'Why isn’t each EMI split into principal and interest?',
    answer:
      'The split needs the real rate and start date. With them, the loan’s own page shows the full schedule; without them, a made-up split would be worse than none.',
  },
  {
    question: 'What is “Still to pay”?',
    answer:
      'Every EMI still to come, added up — what will actually leave your hands, which stays knowable even when the terms aren’t. It isn’t the same as the principal outstanding.',
  },
];

const ELSEWHERE: { thing: string; where: string }[] = [
  { thing: 'When this month’s EMI is due, and whether it’s paid', where: 'Months' },
  { thing: 'The balance of the account an EMI leaves from', where: 'Accounts' },
  { thing: 'Every EMI payment you’ve recorded', where: 'Ledger' },
];

interface DebtsGuideSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "How Debts works" - the counterpart of the Ledger, Today, Months and Accounts guides.
 *
 * <p>Debts is where the product most often declines to show a number - no payoff date, no
 * repaid figure, no interest split - and each refusal reads as missing data unless the
 * reason is one click away. This is also where the note about EMIs not being split used
 * to sit, as a paragraph under the list that nobody was looking for at that moment.
 */
export function DebtsGuideSheet({ open, onClose }: DebtsGuideSheetProps) {
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
            {BADGES.map((b) => (
              <div
                key={b.label}
                className="grid grid-cols-[9rem_minmax(0,1fr)] gap-space-3 border-b border-line px-space-4 py-space-3 last:border-b-0"
              >
                <span className="text-label font-medium text-ink">{b.label}</span>
                <span className="text-caption text-ink-muted">{b.means}</span>
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
          <p className="mb-space-3 text-label font-medium text-ink">Not on Debts, on purpose</p>
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
