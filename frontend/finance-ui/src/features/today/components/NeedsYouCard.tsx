import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Amount } from '@/components/Amount';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { InstanceAmountForm } from '@/features/commitments/components/InstanceAmountForm';
import { formatShortDate, daysBetween } from '@/lib/dates';
import { useConfirmCommitmentInstanceMutation } from '@/services/commitmentInstanceService';
import { useGetProjectionQuery } from '@/services/projectionService';
import { useAppDispatch } from '@/store/hooks';
import { openSettleSheet } from '@/store/slices/uiSlice';
import type { CommitmentInstanceResponse } from '@/types/commitment';
import type { AccountResponse } from '@/types/api';

interface NeedsYouCardProps {
  attentionInstances: CommitmentInstanceResponse[];
  instancesLoading: boolean;
  instancesError: boolean;
  /** Every spendable account is checked for a shortfall independently - see ShortfallItem. */
  spendableAccountIds: number[];
  /** Every account, to say where each bill leaves from and how fresh its balance is. */
  accounts: AccountResponse[];
}

const TINT_STYLE = { backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' } as const;

/**
 * Marks an element as "something is in this section". The empty line is pure CSS keyed
 * off the absence of this attribute - see `NeedsYouCard`.
 */
const ITEM = { 'data-needs-you': '' } as const;

/** One tinted, clickable item. Every Needs You entry has the same shape - a warning,
 *  what it's about, why it's here, and one action - so they read as one list. */
function AttentionItem({
  onOpen,
  title,
  amount,
  reason,
  detail,
  check,
  action,
}: {
  onOpen: () => void;
  title: React.ReactNode;
  amount?: React.ReactNode;
  reason: React.ReactNode;
  detail?: React.ReactNode;
  /** Whether the money will be there - see `CoverCheck`. Outside the clickable area so its link works. */
  check?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div {...ITEM} className="flex flex-col gap-space-3 rounded-xl p-space-4" style={TINT_STYLE}>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        className="flex items-start gap-space-3 rounded-md text-left"
      >
        <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-space-3">
            <span className="text-row text-ink hover:underline hover:underline-offset-4">{title}</span>
            {amount}
          </div>
          <p className="mt-space-1 text-caption text-attention">{reason}</p>
          {detail && <p className="mt-space-1 text-caption text-ink-muted">{detail}</p>}
        </div>
      </div>
      {check && <div className="pl-[30px]">{check}</div>}
      {action && <div className="pl-[30px]">{action}</div>}
    </div>
  );
}

/**
 * One query per account, each in its own component - React doesn't allow calling a
 * hook a variable number of times inside a single component's render. Renders nothing
 * when the account isn't projected to fall short.
 *
 * <p>Two genuinely different situations share the `shortfall` flag, and saying which is
 * the fix: an account can be short *right now*, or short *by a date* because a specific
 * bill is still to leave it.
 */
function ShortfallItem({ accountId }: { accountId: number }) {
  const navigate = useNavigate();
  const { data, isLoading } = useGetProjectionQuery(accountId);

  // A placeholder that counts as an item, so the empty line can't claim "nothing needs
  // you" before this account has actually been checked.
  if (isLoading) return <Skeleton {...ITEM} className="h-16 w-full rounded-xl" />;
  if (!data || !data.shortfall) return null;

  const alreadyShort = Number(data.currentBalance) < 0;
  const nextDeduction = [...data.deductions].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  return (
    <AttentionItem
      onOpen={() => navigate(`/accounts/${accountId}`)}
      title={data.accountName}
      amount={<Amount value={alreadyShort ? data.currentBalance : data.projectedBalance} role="row" emphasiseNegative />}
      reason={
        alreadyShort
          ? 'Already below zero'
          : nextDeduction
            ? `Will fall short on ${formatShortDate(nextDeduction.dueDate)}, when ${nextDeduction.name} leaves`
            : `Projected to fall short by ${formatShortDate(data.projectionDate)}`
      }
      detail={
        alreadyShort
          ? 'Counts against your spending money. Move money in if it’s an overdraft - or if it’s actually a loan, add it under Debts so it stops counting.'
          : 'Move money into it before then, or the payment may bounce.'
      }
    />
  );
}

const CONFIDENCE_WORD = { CONFIRMED: 'matched with the bank', ESTIMATED: 'an estimate', UNKNOWN: 'a guess' } as const;

/**
 * "Is the money actually there for this bill?" - the planned bill, the account it leaves
 * from, and what that account will hold once it (and every bill due before it) has left.
 * Figures are the server's (`balanceAfter`, `covered`); nothing is added up here.
 *
 * <p>Kosh's balance is only as good as the last time it was matched with the bank, so the
 * second line says when that was and points at Update balance - the cross-check is the
 * point, not a formality. Money moved in before the date isn't in the projection, which
 * is why a shortfall says "unless you move money in".
 */
function CoverCheck({ instance, account }: { instance: CommitmentInstanceResponse; account: AccountResponse | undefined }) {
  const isCard = instance.account.type === 'CREDIT_CARD';
  const isIncome = instance.settleAs === 'INCOME';
  const { data } = useGetProjectionQuery(instance.account.id, { skip: isCard || isIncome });

  if (isIncome) {
    return (
      <p className="text-caption text-ink-muted">
        Expected into <span className="text-ink-soft">{instance.account.name}</span> - arrived? Record it, so this month’s
        plan counts what actually came in.
      </p>
    );
  }

  if (isCard) {
    return (
      <p className="text-caption text-ink-muted">
        Planned · charged to <span className="text-ink-soft">{instance.account.name}</span>, paid with its statement
      </p>
    );
  }

  const deduction = data?.deductions.find((d) => d.commitmentInstanceId === instance.id);
  // No amount yet, or not open - nothing honest to say about cover.
  if (!deduction) return null;
  const short = deduction.covered === false;
  const floor = account?.minimumBalance;

  return (
    <div className="flex flex-col gap-space-1 text-caption">
      <p className={short ? 'text-attention' : 'text-ink-muted'}>
        Planned · leaves <span className={short ? undefined : 'text-ink-soft'}>{instance.account.name}</span> on{' '}
        {formatShortDate(deduction.dueDate)} ·{' '}
        {short ? (
          <>
            not enough there: <Amount value={deduction.balanceAfter} role="caption" /> after it and earlier bills
            {floor ? (
              <>
                {' '}
                (minimum <Amount value={floor} role="caption" />)
              </>
            ) : null}
            , unless you move money in
          </>
        ) : (
          <>
            <Amount value={deduction.balanceAfter} role="caption" className="text-ink-soft" /> left after it and earlier bills
          </>
        )}
      </p>
      {account && (
        <p className="text-ink-muted">
          Balance {CONFIDENCE_WORD[account.openingConfidence]} on {formatShortDate(account.openingAsOf)}, plus entries since.{' '}
          <Link to={`/accounts/${account.id}`} className="text-accent underline-offset-2 hover:underline">
            Check it against your bank app
          </Link>
        </p>
      )}
    </div>
  );
}

/** Why this bill is here, in the words Month's Needs You uses - both filter on the same
 *  server-computed attentionTier, so they must describe it the same way. */
function reasonFor(instance: CommitmentInstanceResponse): string {
  if (instance.status === 'NEEDS_REVIEW') return "Needs a look - something doesn't add up";
  if (instance.status === 'UNVERIFIED') return 'Not yet confirmed with the bank';
  if (instance.expectedAmount == null) return 'Needs an amount before your Room is certain';
  const days = daysBetween(instance.dueDate);
  if (instance.status === 'OVERDUE') {
    const overdue = Math.abs(days);
    const ago = `${overdue} ${overdue === 1 ? 'day' : 'days'}`;
    // A planned move or income isn't "overdue" like a bill - it's something that was
    // meant to happen and hasn't been recorded.
    if (instance.settleAs === 'INCOME') return `Expected ${ago} ago - not recorded yet`;
    if (instance.settleAs === 'TRANSFER' || instance.settleAs === 'INVESTMENT') {
      return `Planned for ${formatShortDate(instance.dueDate)} - not recorded yet`;
    }
    return `Overdue by ${ago}`;
  }
  if (days <= 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

/**
 * Needs You - SCREEN_SPECS S1 hierarchy #3. Amber, never red: attention ≠ critical.
 *
 * <p>Three things were wrong with the previous version, all of them visible without any
 * data problem at all:
 * <ul>
 *   <li>With accounts but nothing short and no bills flagged, it rendered the "NEEDS YOU"
 *       label and then nothing - an empty heading, which reads as broken, not as calm.
 *       SCREEN_SPECS is explicit that this state is "an achievement, not a void".</li>
 *   <li>While the checks were still loading, and when the bills endpoint failed outright,
 *       it said nothing needed you - the one sentence on this screen that must never be
 *       said without knowing (ADR-0006).</li>
 *   <li>Its heading was a bare 11px label while every other section on the page used
 *       `SectionHeader`, so the page's two columns didn't line up as a pair.</li>
 * </ul>
 *
 * <p>The empty line is CSS rather than state: the per-account checks live in child
 * components, and hoisting their results up just to count them would mean re-fetching
 * or prop-drilling callbacks for a boolean. `:has()` asks the DOM what it already knows.
 */
export function NeedsYouCard({ attentionInstances, instancesLoading, instancesError, spendableAccountIds, accounts }: NeedsYouCardProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [confirm] = useConfirmCommitmentInstanceMutation();

  return (
    <section>
      <SectionHeader>Needs you</SectionHeader>

      <div className="group/needs flex flex-col gap-space-3">
        {spendableAccountIds.map((id) => (
          <ShortfallItem key={id} accountId={id} />
        ))}

        {instancesLoading && <Skeleton {...ITEM} className="h-16 w-full rounded-xl" />}

        {instancesError && (
          <p {...ITEM} className="flex items-start gap-space-2 text-body text-ink-soft">
            <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
            We couldn’t check your bills just now, so this list may be incomplete.
          </p>
        )}

        {attentionInstances.map((instance) => (
          <AttentionItem
            key={instance.id}
            onOpen={() => navigate(`/commitments/${instance.id}`)}
            title={instance.commitmentName}
            amount={instance.outstanding != null ? <Amount value={instance.outstanding} role="row" className="text-ink" /> : undefined}
            reason={reasonFor(instance)}
            detail={instance.ifSkipped ? `If skipped: ${instance.ifSkipped}` : undefined}
            check={<CoverCheck instance={instance} account={accounts.find((a) => a.id === instance.account.id)} />}
            action={
              // An amount-less bill needs a number, not a payment - Settle would ask you
              // to record money that hasn't moved yet.
              instance.expectedAmount == null && instance.status !== 'UNVERIFIED' ? (
                <InstanceAmountForm instanceId={instance.id} name={instance.commitmentName} />
              ) : instance.status === 'UNVERIFIED' ? (
                <Button size="sm" variant="secondary" onClick={() => confirm(instance.id)}>
                  Confirm
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => dispatch(openSettleSheet(instance.id))}>
                  {instance.settleAs === 'INCOME' ? 'Received' : instance.settleAs === 'EXPENSE' ? 'Settle' : 'Record it'}
                </Button>
              )
            }
          />
        ))}

        <p className="hidden items-center gap-space-2 text-body text-ink-soft group-[:not(:has([data-needs-you]))]/needs:flex">
          <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
          Nothing needs you today.
        </p>
      </div>
    </section>
  );
}
