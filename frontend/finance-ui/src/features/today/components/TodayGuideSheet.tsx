import { X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

/** The chain, one line each, in the order the server computes it. Words, not figures:
 *  the live numbers are on the page behind this sheet, and a guide that repeated them
 *  would go stale the moment anything was recorded. */
const CHAIN: { term: string; means: string }[] = [
  { term: 'Held', means: 'Everything in your bank accounts and cash, right now.' },
  { term: '− Reserved', means: 'Money you set aside for something specific - an emergency fund, a trip.' },
  { term: '− Committed', means: 'Bills and EMIs still to leave before your next salary.' },
  { term: '− Owed on cards', means: 'Already spent on credit cards, still to be paid.' },
  { term: '= Free until salary', means: 'What is genuinely yours to decide about until payday.' },
  { term: '÷ Days to salary', means: 'Spread evenly - “a day” under the big number. Spend less and tomorrow’s share grows.' },
];

/**
 * Situations first, the same shape the Ledger guide was rewritten into after its
 * type-by-type version didn't land. The questions below are the ones the number itself
 * raises - "why did it drop when I didn't spend anything?" is the one that makes people
 * stop trusting a figure, so it is answered before anything is defined.
 */
const CASES: { question: string; answer: string }[] = [
  {
    question: 'Free until salary dropped, but I didn’t spend anything',
    answer:
      'Something new was claimed: a bill was added or its amount became known, you reserved money, or an account balance was corrected downward.',
  },
  {
    question: 'Free until salary went up',
    answer: 'Money arrived (income, a refund), a bill settled for less than expected, or a reservation was released.',
  },
  {
    question: 'The big number shows “—”',
    answer:
      'A bill that must be paid has no amount yet, so what’s left can’t be known. Give it an amount - even an estimate - and the number comes back.',
  },
  {
    question: 'An account says it’s “already short”',
    answer:
      'It holds less than zero. Usually an overdraft - or a loan that was added as a bank account, which then counts against your spending money. Loans belong under Debts.',
  },
  {
    question: 'A bill says “not yet confirmed”',
    answer: 'You marked it to double-check with the bank. Once it shows on your statement, press Confirm.',
  },
  {
    question: 'A bill is overdue',
    answer: 'Its date passed without being settled. Settle it if you paid, and the payment is recorded in the Ledger.',
  },
];

const ELSEWHERE: { thing: string; where: string }[] = [
  { thing: 'Every bill this cycle, not just the next few', where: 'Months' },
  { thing: 'Every transaction, and why a balance is what it is', where: 'Ledger' },
  { thing: 'Account balances, cards and net worth', where: 'Accounts' },
  { thing: 'Loans and how much is left on each', where: 'Debts' },
];

interface TodayGuideSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "How Today works" - the Today counterpart of `LedgerGuideSheet`.
 *
 * <p>Today is judged by one figure (SCREEN_SPECS S1), and a figure people don't
 * understand is a figure they second-guess against their banking app - at which point
 * the product has stopped doing its job. The page shows the derivation (Where you stand)
 * but not *why it moved*, which is the question that actually comes up.
 */
export function TodayGuideSheet({ open, onClose }: TodayGuideSheetProps) {
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
            {CHAIN.map((c) => (
              <div
                key={c.term}
                className="grid grid-cols-[9rem_minmax(0,1fr)] gap-space-3 border-b border-line px-space-4 py-space-2 last:border-b-0"
              >
                <span
                  className={
                    c.term.startsWith('=') ? 'text-label font-medium text-accent' : 'text-label text-ink'
                  }
                >
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
            {CASES.map((c) => (
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
