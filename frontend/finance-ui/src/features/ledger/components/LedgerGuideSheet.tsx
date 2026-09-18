import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, TrendingUp, RotateCcw, Check, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { cn } from '@/lib/cn';
import type { TypeTint } from '@/features/transactions/components/transactionForm';

interface GuideType {
  icon: LucideIcon;
  name: string;
  tint: TypeTint;
  meaning: string;
  example: string;
  from: string;
  to?: string;
}

const TYPES: GuideType[] = [
  {
    icon: ArrowUpRight,
    name: 'Expense',
    tint: 'critical',
    meaning: 'Money that left you - the only kind that counts as spending.',
    example: '₹800 on dinner, an EMI, a subscription',
    from: 'a bank account, cash, or a credit card',
  },
  {
    icon: ArrowDownRight,
    name: 'Income',
    tint: 'positive',
    meaning: 'Money that arrived from outside - a salary, a client, interest.',
    example: 'Salary credited, a freelance payment',
    from: '(the account it landed in)',
  },
  {
    icon: RotateCcw,
    name: 'Refund',
    tint: 'positive',
    meaning: "Money that came back against something you'd already spent on.",
    example: 'A returned shirt, an overcharge reversed',
    from: '(the account it landed in)',
  },
  {
    icon: ArrowRightLeft,
    name: 'Transfer',
    tint: 'neutral',
    meaning: 'Money moving between accounts you already own. Never spending.',
    example: 'Salary account → emergency fund, paying a card bill',
    from: 'a bank account or cash',
    to: 'a bank account, cash, credit card, loan, or investment account',
  },
  {
    icon: TrendingUp,
    name: 'Investment',
    tint: 'neutral',
    meaning: 'Money moving into something you hold, not something you spend.',
    example: 'A SIP instalment, an RD contribution',
    from: 'a bank account or cash',
    to: 'an investment account',
  },
];

/**
 * The part people actually come here for. Not "what are the five types" - "I just did
 * this thing, what do I record?"
 *
 * <p>Every row is a situation from the source workbook's own ledger, and the four in the
 * middle are the ones where getting it wrong counts the same money twice: a card swipe
 * and its bill payment, a cash withdrawal and the cash spend. Rule 4 is enforced by the
 * posting model, but only if the entry is recorded as the right kind in the first place.
 */
const CASES: { did: string; record: string; why: string }[] = [
  { did: 'Swiped a credit card', record: 'Expense, from the card, on the day you swiped', why: 'Counted once, when you committed the money - not when the bill clears.' },
  { did: 'Paid the credit-card bill', record: 'Transfer, bank → card', why: 'The spending was already counted at each swipe. This only settles it.' },
  { did: 'Took cash out of an ATM', record: 'Transfer, bank → cash', why: "You still have the money, it just moved. Nothing has been spent yet." },
  { did: 'Spent that cash', record: 'Expense, from Cash', why: 'This is the moment it actually left you.' },
  { did: 'Paid an EMI', record: 'Expense, category Loan EMI', why: 'The interest and principal split is computed on Debts from the loan schedule.' },
  { did: 'Salary landed', record: 'Income', why: 'Money from outside. Its category comes from the Income group.' },
  { did: 'Moved money to savings', record: 'Transfer', why: "It's still yours, so it is neither income nor spending." },
  { did: 'A SIP instalment went out', record: 'Investment', why: 'You still hold it. It leaves your spendable balance without being spent.' },
  { did: 'A shop refunded you', record: 'Refund, same category as the original', why: 'It reverses an expense rather than becoming new income.' },
];

/** Things people reasonably expect to type in here, that live elsewhere. Stated because
 *  "what goes here" is only half answered without "and what doesn't". */
const ELSEWHERE: { thing: string; where: string }[] = [
  { thing: 'A bill that is due but not yet paid', where: 'Months - it becomes a Ledger entry the day it is actually paid' },
  { thing: "An EMI's interest-vs-principal split", where: "Debts - computed from the loan's own schedule, never typed" },
  { thing: "A fund's value going up or down", where: 'Investments - a valuation, not money that moved' },
  { thing: "An account's opening balance", where: 'Accounts - set when you add the account' },
];

interface LedgerGuideSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "What belongs in the Ledger, and why an entry gets rejected."
 *
 * <p>Rewritten after the type-by-type version didn't land. It had opened with the
 * product's own taxonomy - here are five types, here is what each one means - which
 * answers a question nobody was asking. The question is "I just paid my card bill, what
 * do I put in?", so the situations now come first and the taxonomy is reference material
 * underneath them.
 *
 * <p>The rules it states are the ones enforced server-side after two real domain gaps
 * were found and closed (LEDGER_IMPROVEMENT_PLAN.md §2): the API used to accept an
 * expense charged against a loan account, and "Salary Credit" had been sitting in a
 * discretionary-spending category group since the categories were first seeded. The
 * wording here matches the error messages, so a rejection reads as "oh, right" rather
 * than "why won't this save".
 */
export function LedgerGuideSheet({ open, onClose }: LedgerGuideSheetProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="What goes in the Ledger"
      footer={
        <Button variant="primary" onClick={onClose} className="w-full">
          Got it
        </Button>
      }
    >
      <div className="flex flex-col gap-space-8">
        <p className="text-body text-ink-soft">
          One line for every time money actually moved -{' '}
          <strong className="font-medium text-ink">once each, on the day it moved</strong>. If it hasn't happened
          yet, it isn't a Ledger entry.
        </p>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">If you just did this…</p>
          <div className="rounded-lg border border-line">
            {CASES.map((c) => (
              <div key={c.did} className="border-b border-line px-space-4 py-space-3 last:border-b-0">
                <div className="flex flex-wrap items-baseline gap-x-space-2">
                  <span className="text-label text-ink">{c.did}</span>
                  <span aria-hidden className="text-ink-muted">
                    →
                  </span>
                  <span className="text-label font-medium text-accent">{c.record}</span>
                </div>
                <p className="mt-space-1 text-caption text-ink-muted">{c.why}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">These don't belong here</p>
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

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">The five kinds, in full</p>
          <div className="flex flex-col gap-space-5">
            {TYPES.map((t) => (
              <div key={t.name} className="flex gap-space-3">
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md',
                    t.tint === 'positive' && 'bg-positive/10 text-positive',
                    t.tint === 'critical' && 'bg-critical/10 text-critical',
                    t.tint === 'neutral' && 'bg-sunken text-ink-muted',
                  )}
                >
                  <t.icon size={15} strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-row font-medium text-ink">{t.name}</p>
                  <p className="text-caption text-ink-soft">{t.meaning}</p>
                  <p className="mt-space-1 text-caption text-ink-muted">e.g. {t.example}</p>
                  <p className="mt-space-1 text-caption text-ink-muted">
                    From: {t.from}
                    {t.to && <> · To: {t.to}</>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line p-space-4">
          <p className="text-label font-medium text-ink">A loan or investment account is never a spending account</p>
          <p className="mt-space-1 text-caption text-ink-soft">
            A loan is a debt you owe, not a wallet you draw from - so it can't be the source of an Expense, Income
            or Refund. It <em>can</em> receive a Transfer (paying it down) or fund nothing itself. The same goes for
            an investment account: money reaches it only as an Investment transfer, never as ordinary spending.
          </p>
          <div className="mt-space-3 flex flex-col gap-space-2">
            <div className="flex items-start gap-space-2 text-caption">
              <X size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-critical" aria-hidden />
              <span className="text-ink-soft">
                <span className="text-ink">Expense</span> from “Education Loan” — a loan isn't something you spend from.
              </span>
            </div>
            <div className="flex items-start gap-space-2 text-caption">
              <Check size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-positive" aria-hidden />
              <span className="text-ink-soft">
                <span className="text-ink">Transfer</span> from “HDFC Salary” to “Education Loan” — a prepayment, recorded correctly.
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line p-space-4">
          <p className="text-label font-medium text-ink">Categories point one way</p>
          <p className="mt-space-1 text-caption text-ink-soft">
            Income categories (Salary, Freelance, Interest) are only for Income. Every other category is for
            spending - Expense and Refund both use them, because a refund reverses an earlier expense rather than
            becoming new income. The category picker only ever shows the ones that fit what you're recording.
          </p>
          <p className="mt-space-2 text-caption text-ink-soft">
            Sub-categories are yours to make: put “Fuel” and “Cab” under “Transport” and you can record them
            separately while Transport stays one comparable line on Months.
          </p>
        </div>
      </div>
    </Modal>
  );
}
