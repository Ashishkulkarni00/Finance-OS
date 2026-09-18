import { X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

/** The three figures an account row can show, and what separates them. */
const FIGURES: { term: string; means: string }[] = [
  { term: 'Balance', means: 'What the account holds right now, from your opening balance and every entry since.' },
  {
    term: 'Held',
    means: 'The part you shouldn’t move: the bank’s required minimum, or money you reserved — whichever is larger.',
  },
  { term: 'Available', means: 'Balance minus what’s held. What you can actually move out of this account.' },
];

/** Situations first - the questions this page raises, the same shape as the Ledger,
 *  Today and Months guides. */
const CASES: { question: string; answer: string }[] = [
  {
    question: 'Why is my net worth negative?',
    answer:
      'Everything you owe that’s recorded here is more than everything you own that’s recorded here. That’s normal while paying off a loan — it’s a position, not a verdict.',
  },
  {
    question: 'Why does net worth say “Approximate”?',
    answer:
      'At least one account’s starting balance was entered as an estimate or left unknown. Net worth is built from account balances, so it can only be as exact as they are. Confirm those balances against a statement and the label goes away.',
  },
  {
    question: 'A bank account shows below zero',
    answer:
      'Either it’s genuinely overdrawn — and anything else debiting it can bounce — or it’s actually a loan that was added as a bank account. A loan belongs under Debts; as a bank account it’s counted as spending money and as something you own.',
  },
  {
    question: 'My investments aren’t in net worth',
    answer:
      'Holdings kept outside your accounts — an NPS or PF your employer deducts, say — have no account balance to add up, and nothing counts until it’s valued. Add what they’re worth on the Investments tab.',
  },
  {
    question: 'What does “Pays for” mean on an account?',
    answer: 'The bills set to leave from that account every month, so you can see at a glance what depends on it.',
  },
  {
    question: 'How is “Yours to move” different from what’s free on Months?',
    answer:
      'Yours to move is before this cycle’s bills. Months takes every bill still due out of it, which is why its figure is smaller.',
  },
];

const ELSEWHERE: { thing: string; where: string }[] = [
  { thing: 'What you spent this cycle, and what’s still due', where: 'Months' },
  { thing: 'Every entry behind a balance', where: 'Ledger' },
  { thing: 'What you can spend today', where: 'Today' },
  { thing: 'Recording a payment or a transfer', where: 'the Add button' },
];

interface AccountsGuideSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "How Accounts works" - the counterpart of the Ledger, Today and Months guides.
 *
 * <p>Accounts is where two numbers that look like they should agree most often don't:
 * a balance and what's available, net worth and what feels like "mine". Every one of
 * those gaps has a one-sentence reason.
 */
export function AccountsGuideSheet({ open, onClose }: AccountsGuideSheetProps) {
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
          <p className="mb-space-3 text-label font-medium text-ink">Three figures on an account</p>
          <div className="rounded-lg border border-line">
            {FIGURES.map((f) => (
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
            {CASES.map((c) => (
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
