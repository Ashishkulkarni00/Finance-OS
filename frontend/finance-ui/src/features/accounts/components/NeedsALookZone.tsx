import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { formatMoney } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import { useGetProjectionQuery } from '@/services/projectionService';
import type { AccountResponse } from '@/types/api';

const TINT_STYLE = { backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' } as const;

/** Marks "something is in this zone". The empty line is CSS keyed off its absence - the
 *  projection checks live in child components, so there is no single list to count. */
const ITEM = { 'data-needs-look': '' } as const;

/**
 * Every attention card routes through here, so "this is clickable" is never in question -
 * a chevron plus the whole card as the click target, the same affordance as Month.
 *
 * <p>Each card carries three things deliberately: what is wrong, the figures that make it
 * true, and what happens if it's left alone.
 */
function AttentionCard({
  title,
  because,
  consequence,
  accountId,
}: {
  title: string;
  because: string;
  consequence: string;
  accountId: number;
}) {
  const navigate = useNavigate();
  const go = () => navigate(`/accounts/${accountId}`);
  return (
    <Card
      {...ITEM}
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
      </div>
      <ChevronRight size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
    </Card>
  );
}

/** A spendable account not already flagged by its own balance, checked for a projected
 *  shortfall - one query per account, same pattern as Today's shortfall check. */
function ProjectedShortfallCard({ account }: { account: AccountResponse }) {
  const { data, isLoading } = useGetProjectionQuery(account.id);

  // Counts as an item while loading, so "Nothing needs a look" can't be claimed before
  // this account has actually been checked.
  if (isLoading) return <Skeleton {...ITEM} className="h-20 w-full rounded-xl" />;
  if (!data || !data.shortfall || Number(account.currentBalance) < 0) return null;

  const nextDeduction = [...data.deductions].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  return (
    <AttentionCard
      title={`${account.name} won't cover what's coming`}
      because={
        nextDeduction
          ? `Holds ${formatMoney(account.currentBalance)}. ${nextDeduction.name} takes ${formatMoney(nextDeduction.amount)} on ${formatShortDate(nextDeduction.dueDate)}.`
          : `Holds ${formatMoney(account.currentBalance)}, against what's already scheduled to leave.`
      }
      consequence={`Projected short by ${formatShortDate(data.projectionDate)}. Open it to see every upcoming debit and move money in before it bounces.`}
      accountId={account.id}
    />
  );
}

interface NeedsALookZoneProps {
  accounts: AccountResponse[];
  isLoading: boolean;
}

/**
 * Zone 2 - Accounts' own "Needs you", the same pattern as Today's and Month's
 * (ACCOUNTS_EXPERIENCE.md §4), still client-composed from data already on hand.
 *
 * <p>Ranked by what costs money soonest: below a mandatory minimum · below zero ·
 * reservations exceeding the balance · projected to fall short · below your own target.
 *
 * <p>Brought in line with Today and Month:
 * <ul>
 *   <li>The heading is always there. It used to appear only for balance-based problems,
 *       so a projected-shortfall card on its own rendered with no heading at all.</li>
 *   <li>An empty zone says "Nothing needs a look" instead of disappearing - and never says
 *       it while the shortfall checks are still running.</li>
 *   <li>"Below zero" no longer asserts "overdrawn - more has left than went in". A bank
 *       account below zero is either an overdraft or a loan recorded as a bank account,
 *       and the page can't tell which, so the card says both. (ACCOUNTS_UX_SPEC §9 has
 *       this zone omitted when empty; the three screens now agree instead.)</li>
 * </ul>
 */
export function NeedsALookZone({ accounts, isLoading }: NeedsALookZoneProps) {
  const active = accounts.filter((a) => !a.archived);

  const belowMinMandatory = active.filter((a) => a.belowMinimumBalance && a.minimumBalanceMandatory);
  const belowZero = active.filter(
    (a) => a.countsAsSpendable && Number(a.currentBalance) < 0 && !belowMinMandatory.includes(a),
  );
  const overReserved = active.filter(
    (a) =>
      Number(a.hold.reserved) > 0 &&
      Number(a.available) < 0 &&
      !belowMinMandatory.includes(a) &&
      !belowZero.includes(a),
  );
  const belowMinOptional = active.filter(
    (a) =>
      a.belowMinimumBalance &&
      !a.minimumBalanceMandatory &&
      !belowMinMandatory.includes(a) &&
      !belowZero.includes(a) &&
      !overReserved.includes(a),
  );
  const spendableForProjection = active.filter(
    (a) =>
      a.countsAsSpendable &&
      !belowMinMandatory.includes(a) &&
      !belowZero.includes(a) &&
      !overReserved.includes(a),
  );

  return (
    <section>
      <SectionHeader>Needs a look</SectionHeader>

      <div className="group/look flex flex-col gap-space-3">
        {isLoading && <Skeleton {...ITEM} className="h-20 w-full rounded-xl" />}

        {belowMinMandatory.map((a) => (
          <AttentionCard
            key={a.id}
            title={`${a.name} is under the minimum the bank requires`}
            because={`Holds ${formatMoney(a.currentBalance)}, and the bank requires ${formatMoney(a.minimumBalance)} stay in.`}
            consequence="The bank can charge a penalty for this. Open it to see what drew it down, and top it up."
            accountId={a.id}
          />
        ))}

        {belowZero.map((a) => (
          <AttentionCard
            key={a.id}
            title={`${a.name} is below zero`}
            because={`Holds ${formatMoney(a.currentBalance)}.`}
            consequence="If it’s an overdraft, anything else debiting it can bounce. If it’s actually a loan added as a bank account, add it under Debts instead — as a bank account it counts against your spending money and your assets."
            accountId={a.id}
          />
        ))}

        {overReserved.map((a) => (
          <AttentionCard
            key={a.id}
            title={`${a.name} has been dipped into`}
            because={`${formatMoney(a.hold.reserved)} is reserved${
              a.hold.reservedFor.length > 0 ? ` for ${a.hold.reservedFor.join(' and ')}` : ''
            }, but only ${formatMoney(a.currentBalance)} is there.`}
            consequence="The balance looks fine, so nothing else will warn you — but the money set aside isn’t all there. Open it to see what it went on."
            accountId={a.id}
          />
        ))}

        {!isLoading && spendableForProjection.map((a) => <ProjectedShortfallCard key={a.id} account={a} />)}

        {belowMinOptional.map((a) => (
          <AttentionCard
            key={a.id}
            title={`${a.name} is under your own target`}
            because={`Holds ${formatMoney(a.currentBalance)}, against a target of ${formatMoney(a.minimumBalance)}.`}
            consequence="Your target, not the bank’s — nothing happens if you leave it. Open it if you’d like to top it up."
            accountId={a.id}
          />
        ))}

        <p className="hidden items-center gap-space-2 text-body text-ink-soft group-[:not(:has([data-needs-look]))]/look:flex">
          <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
          Nothing needs a look.
        </p>
      </div>
    </section>
  );
}
