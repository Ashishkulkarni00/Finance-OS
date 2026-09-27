import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, TrendingUp, RotateCcw, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { cn } from '@/lib/cn';
import { byId } from '@/features/help/content';
import { qaOf, elsewhereOf, calloutsOf, fullTopicHref } from '@/features/help/retrofit';
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

/** The five kinds, presentational (icon + tint) rather than manual content - the same
 *  facts already live in the manual's `spending.recording-an-expense` topic, in its
 *  "What do I enter?" fields. Kept here so the sheet still shows this reference table at
 *  a glance without duplicating it as manual content twice over. */
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
 * "What belongs in the Ledger, and why an entry gets rejected."
 *
 * <p>Situations come first, because the question is "I just paid my card bill, what do I
 * put in?", not "what are the five types" - the taxonomy is reference material underneath.
 *
 * <p><strong>Retrofitted</strong> (IN_APP_MANUAL.md §1, §8): the situations table, the two
 * warning boxes and the "these don't belong here" list come from the manual's
 * `spending.how-the-ledger-works` topic, so this sheet and the manual can't disagree about
 * what belongs in the Ledger.
 */
export function LedgerGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const topic = byId['spending.how-the-ledger-works']!;
  const cases = qaOf(topic);
  const elsewhere = elsewhereOf(topic);
  const callouts = calloutsOf(topic);

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
          <p className="mb-space-3 text-label font-medium text-ink">These don't belong here</p>
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

        {callouts.map((c) => (
          <div key={c.text} className={cn('border-l-[3px] py-space-1 pl-space-4', c.tone === 'warn' ? 'border-attention' : 'border-accent')}>
            <p className="text-caption text-ink-soft">{c.text}</p>
          </div>
        ))}

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
