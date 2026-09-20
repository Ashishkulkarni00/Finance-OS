import { X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

const FIGURES: { term: string; means: string }[] = [
  { term: 'Saved', means: 'What’s currently in the account or reservation you linked the goal to.' },
  { term: 'Target', means: 'How much you want, and the date you want it by.' },
  {
    term: 'A month',
    means:
      'What’s still left to save, divided by the whole months until the date. Not shown in the final month or once the date has passed — there’s no month left to divide by.',
  },
];

/** Situations first - the same shape as every other screen's guide. */
const CASES: { question: string; answer: string }[] = [
  {
    question: 'How does a goal know how much I’ve saved?',
    answer:
      'From what you chose under “Saved in”. Linked to an account, saved is that account’s balance — money in or out moves the goal. Linked to a reservation, saved is the amount reserved — raise the reservation and the goal moves. A goal linked to nothing stays at zero.',
  },
  {
    question: 'What should I track a goal in?',
    answer:
      'A reservation is best when the money sits in an account you also use — it sets that amount aside, so it stops counting as spending money. A separate account works when the savings live on their own.',
  },
  {
    question: 'Why did “a month” go up?',
    answer:
      'Either less went in than planned, or the date came closer with the same gap still to close. It’s the honest cost of the target and date you set — change either and it recalculates.',
  },
  {
    question: 'A trip in December, but bookings to pay in October',
    answer:
      'Make the goal the whole trip, by the day you travel. On its page, add the bookings under Payments with their date and amount. The goal then says what you need by each date - the October bookings set the pace, not December - and the bookings show on Months in October, taken out of what’s free there. The rest is due on the trip date; plan it as a payment too if you want December set aside for it.',
  },
  {
    question: 'Paying a booking made my goal go down?',
    answer:
      'It doesn’t: progress counts what’s saved plus what the goal has already paid out, so money leaving for the trip still counts toward it.',
  },
  {
    question: 'Is a goal the same as a budget?',
    answer: 'No. A goal is money you’re putting aside for something. What you spend day to day is on Months.',
  },
];

const ELSEWHERE: { thing: string; where: string }[] = [
  { thing: 'Setting money aside inside an account', where: 'Accounts' },
  { thing: 'Recurring bills and what’s due this cycle', where: 'Months' },
  { thing: 'Investments you’re building up', where: 'Investments' },
];

interface GoalsGuideSheetProps {
  open: boolean;
  onClose: () => void;
}

/** "How Goals works" - the counterpart of every other screen's guide. */
export function GoalsGuideSheet({ open, onClose }: GoalsGuideSheetProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How Goals works"
      footer={
        <Button variant="primary" onClick={onClose} className="w-full">
          Got it
        </Button>
      }
    >
      <div className="flex flex-col gap-space-8">
        <p className="text-body text-ink-soft">
          Goals answers <strong className="font-medium text-ink">what you’re saving towards and whether you’re on course</strong>.
          Every figure comes from real balances — nothing is assumed about what you’ll put in later.
        </p>

        <div>
          <p className="mb-space-3 text-label font-medium text-ink">Three figures on a goal</p>
          <div className="rounded-lg border border-line">
            {FIGURES.map((f) => (
              <div
                key={f.term}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-space-3 border-b border-line px-space-4 py-space-3 last:border-b-0"
              >
                <span className="text-label font-medium text-goal">{f.term}</span>
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
          <p className="mb-space-3 text-label font-medium text-ink">Not on Goals</p>
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
