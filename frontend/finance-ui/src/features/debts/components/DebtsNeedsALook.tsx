import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card } from '@/components/Card';
import { SectionHeader } from '@/components/SectionHeader';
import { formatMoney } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import { termsMismatch } from '../loanTerms';
import { LoanPlanLink, loanNeedsPlanBill } from './LoanPlanLink';
import type { LoanResponse } from '@/types/loan';

const TINT_STYLE = { backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' } as const;

/** What's wrong, the figures that make it true, and what happens if it's left - the same
 *  three-part card as Accounts' Needs a look. */
function AttentionCard({
  loan,
  title,
  because,
  consequence,
  action,
}: {
  loan: LoanResponse;
  title: string;
  because: string;
  consequence: string;
  action?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const go = () => navigate(`/loans/${loan.id}`);
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      }}
      className="flex cursor-pointer items-start gap-space-3 transition-opacity hover:opacity-90"
      style={TINT_STYLE}
    >
      <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-body text-ink">{title}</p>
        <p className="num mt-space-1 text-caption text-attention">{because}</p>
        <p className="mt-space-1 text-caption text-ink-muted">{consequence}</p>
        {action && <div className="mt-space-3">{action}</div>}
      </div>
      <ChevronRight size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
    </Card>
  );
}

/**
 * Debts' Needs a look - the loans whose figures can't be fully trusted yet, and why.
 *
 * <p>Always rendered, with a heading and a calm line when empty, the same as Today, This
 * Month and Accounts; this zone used to vanish entirely when there was nothing in it.
 *
 * <p>Checks in order of consequence:
 * <ul>
 *   <li><strong>Payment unverified</strong> - counted as still owed until confirmed.</li>
 *   <li><strong>An EMI fell due and wasn't recorded</strong> - while that's true, the
 *       balance, EMIs left and payoff date are all still describing last month.</li>
 *   <li><strong>Figures that disagree</strong> - everything shown rests on them.</li>
 *   <li><strong>Terms not supplied</strong> - no payoff date, no repaid figure.</li>
 *   <li><strong>EMI not in the plan</strong> - what's free reads that much too high.</li>
 *   <li><strong>Paying account not recorded</strong> - knowing which account an EMI
 *       depends on is how you'd notice that account can't cover it.</li>
 * </ul>
 * One card per loan: a loan with several gaps shows the most consequential, so the zone
 * reads as a short to-do list rather than the same loan three times.
 */
export function DebtsNeedsALook({ loans }: { loans: LoanResponse[] }) {
  const cards = loans.flatMap((loan) => {
    if (loan.status === 'UNCONFIRMED') {
      return [
        <AttentionCard
          key={loan.id}
          loan={loan}
          title={`${loan.account.name} — this month’s payment isn’t verified`}
          because={`${formatMoney(loan.emi)} was due, and we couldn’t confirm it left.`}
          consequence="It’s counted as still owed until you confirm it — the safe direction to be wrong in. Open it to check and mark it paid."
        />,
      ];
    }
    // An EMI that fell due and wasn't recorded comes first among the rest: until it is,
    // this loan's balance, EMIs left and payoff date are all still describing last month
    // (ROADMAP 1.2). Nothing else shown for the loan is trustworthy while it's true.
    if (loan.unrecordedEmis > 0) {
      const n = loan.unrecordedEmis;
      return [
        <AttentionCard
          key={loan.id}
          loan={loan}
          title={`${loan.account.name} — ${n === 1 ? 'an EMI isn’t recorded' : `${n} EMIs aren’t recorded`}`}
          because={
            loan.oldestUnrecordedDue
              ? `${formatMoney(loan.emi)} was due ${formatShortDate(loan.oldestUnrecordedDue)}${n > 1 ? `, and ${n - 1} more since` : ''}, and nothing has been settled against it.`
              : `${formatMoney(loan.emi)} has fallen due with nothing settled against it.`
          }
          consequence="What's owed still counts it, because an EMI isn't assumed paid just because its date passed. Settle it on Months, or correct what's owed here if you paid it another way."
        />,
      ];
    }
    // Figures that disagree come before missing terms: everything shown for the loan rests
    // on them, so a mistyped figure is the more urgent thing to fix.
    const mismatch = termsMismatch(loan);
    if (mismatch) {
      return [
        <AttentionCard
          key={loan.id}
          loan={loan}
          title={`${loan.account.name} — the figures don’t add up`}
          because={mismatch}
          consequence="One of owed, rate, EMI or EMIs left is probably mistyped, so the payoff date can’t be trusted yet. Open it and edit the loan."
        />,
      ];
    }
    if (loan.confidence === 'TBD') {
      return [
        <AttentionCard
          key={loan.id}
          loan={loan}
          title={`${loan.account.name} has no confirmed terms`}
          because={`${loan.emisLeft} payments of ${formatMoney(loan.emi)} are known; the interest rate and payoff date aren’t.`}
          consequence="Nothing is derived from terms we don’t have, so there’s no payoff date or repaid figure. Add the rate from the sanction letter and both appear."
        />,
      ];
    }
    // Not in the plan: its EMI isn't subtracted from what's free (FIX_BACKLOG 1.2).
    if (loanNeedsPlanBill(loan) && loan.payFromAccount) {
      return [
        <AttentionCard
          key={loan.id}
          loan={loan}
          title={`${loan.account.name} — its EMI isn’t in your plan`}
          because={`${formatMoney(loan.emi)} leaves ${loan.payFromAccount.name} every month, and nothing on Months counts it.`}
          consequence="So what's free this month reads that much too high. Put it in the plan once and it follows the loan from then on."
          action={<LoanPlanLink loan={loan} />}
        />,
      ];
    }
    if (loan.paidVia === 'BANK' && !loan.payFromAccount) {
      return [
        <AttentionCard
          key={loan.id}
          loan={loan}
          title={`${loan.account.name} — the account its EMI leaves from isn’t recorded`}
          because={`${formatMoney(loan.emi)} leaves every month, from an account we don’t know.`}
          consequence="Record it so it’s clear which account this EMI depends on, and that account’s balance can be read with it in mind."
        />,
      ];
    }
    return [];
  });

  return (
    <section>
      <SectionHeader trailing={cards.length > 0 ? `${cards.length} to look at` : undefined}>Needs a look</SectionHeader>
      {cards.length > 0 ? (
        <div className="flex flex-col gap-space-3">{cards}</div>
      ) : (
        <p className="flex items-center gap-space-2 text-body text-ink-soft">
          <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
          Nothing needs a look.
        </p>
      )}
    </section>
  );
}
