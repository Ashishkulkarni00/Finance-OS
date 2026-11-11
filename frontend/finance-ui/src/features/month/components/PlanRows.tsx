import { SKIP_REASON_LABEL } from '../skipReasons';
import { Fragment, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { Amount } from '@/components/Amount';
import { ProgressRule } from '@/components/ProgressRule';
import { TypeMark, directionOf } from '@/features/ledger/components/TransactionRow';
import { MetaFacts } from '@/components/LedgerRow';
import { InstanceAmountForm } from '@/features/commitments/components/InstanceAmountForm';
import { WorklistRow } from './WorklistRow';
import { formatShortDate, daysBetween } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { formatMoney, splitMoney } from '@/lib/money';
import { useAppDispatch } from '@/store/hooks';
import { openSettleSheet } from '@/store/slices/uiSlice';
import { useUnskipCommitmentInstanceMutation } from '@/services/commitmentInstanceService';
import type { CommitmentInstanceResponse } from '@/types/commitment';

/*
 * The rows of Month's plan, split out of PlanZone (UI_UX_REVAMP_PLAN Phase 7) so the orchestrator
 * reads as layout and this reads as rows. Behaviour is unchanged by the split.
 */

/** "₹350 more than planned" - magnitude via splitMoney (never a raw Number() on the
 *  amount), direction from the value's sign, both already computed server-side. */
function varianceNote(instance: CommitmentInstanceResponse): string | undefined {
  // Null means we never had both figures - stay silent rather than claim it matched.
  if (instance.variance == null) return undefined;
  if (Number(instance.variance) === 0) return 'Matched what was planned';
  const { symbol, digits } = splitMoney(instance.variance);
  const direction = Number(instance.variance) > 0 ? 'more' : 'less';
  return `${symbol}${digits} ${direction} than planned`;
}

/** "in 3 days" reads as a decision; "12 Sep" needs mental arithmetic first. Date maths
 *  client-side is fine - see the note at the top of lib/dates.ts. */
function duePhrase(dueDate: string): { value: string; tone: 'neutral' | 'soon' | 'overdue' } {
  const days = daysBetween(dueDate);
  if (days < 0) return { value: `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`, tone: 'overdue' };
  if (days === 0) return { value: 'today', tone: 'soon' };
  if (days === 1) return { value: 'tomorrow', tone: 'soon' };
  if (days <= 6) return { value: `in ${days} days`, tone: 'neutral' };
  return { value: formatShortDate(dueDate), tone: 'neutral' };
}

/**
 * "₹500 of ₹2,500 paid", with the rule showing how far in.
 *
 * <p>A part-paid bill used to look exactly like an untouched one - the row showed what was
 * still outstanding and said "Mandatory", so the ₹500 already paid was invisible and the
 * only clue was that the figure had changed since you last looked.
 *
 * <p>The fraction is a proportion, not a figure: it sets a bar's width and is never shown
 * as money, so it is outside FRONTEND_CONVENTIONS §4 rule 2 - every rupee amount here is
 * still the server's own string, rendered by `Amount`. `ProgressRule` is the same
 * instrument the cycle band and the plan's settled count use, so three different kinds of
 * progress on one screen cannot drift into looking like three different kinds of thing.
 */
function PartPaidNote({ instance }: { instance: CommitmentInstanceResponse }) {
  const expected = Number(instance.expectedAmount);
  const fraction = expected > 0 ? Number(instance.confirmedAmount) / expected : 0;
  return (
    <span className="flex flex-col gap-space-1">
      <span>
        <Amount value={instance.confirmedAmount} role="caption" className="text-positive" /> of{' '}
        <Amount value={instance.expectedAmount} role="caption" /> paid
      </span>
      <ProgressRule fraction={fraction} className="max-w-[9rem]" />
    </span>
  );
}

/**
 * One unsettled bill. Its own component because a bill with no amount can open an
 * inline estimate form under the row, and that toggle is per row.
 *
 * <p>Rendered as a Fragment, not wrapped in a div: `LedgerRow` rules itself off with
 * `last:border-b-0`, so a wrapper per row would make every row its wrapper's last child
 * and erase every rule in the list.
 */
export function UnsettledRow({
  instance,
  onEdit,
}: {
  instance: CommitmentInstanceResponse;
  onEdit: () => void;
}) {
  const dispatch = useAppDispatch();
  const [estimating, setEstimating] = useState(false);
  const due = duePhrase(instance.dueDate);
  const unknownAmount = instance.expectedAmount == null;
  const partPaid = instance.status === 'PART_PAID' && instance.confirmedAmount != null && instance.expectedAmount != null;
  const passed = due.tone === 'overdue';

  // Short, like a Ledger row's "Category · Account" (2026-11-11): what kind of commitment it is
  // and whether it can wait. The date lives in the day header above, so it is not repeated here.
  const secondary = passed
    ? unknownAmount
      ? 'Date passed · needs an amount'
      : 'Date passed · paid already? Settle or link it'
    : instance.sourceType === 'LOAN'
      ? 'Loan EMI · follows the loan'
      : [instance.category?.name, instance.mandatory ? 'Must-pay' : 'Optional'].filter(Boolean).join(' · ');

  return (
    <Fragment>
      <WorklistRow
        instanceId={instance.id}
        tone="pending"
        onEdit={onEdit}
        leading={<PlanMark instance={instance} />}
        primary={instance.commitmentName}
        secondary={partPaid ? <PartPaidNote instance={instance} /> : secondary}
        richSecondary={partPaid}
        meta={
          <MetaFacts
            items={[
              { label: 'Pay from', value: instance.account.name },
            ]}
          />
        }
        amount={
          unknownAmount ? (
            <span className="text-caption text-attention">Amount unknown</span>
          ) : (
            <span className="flex flex-col items-end">
              <Amount value={instance.outstanding} role="row" className="text-ink" />
              {/* Says what it differs *from*, not just that it differs - "changed" alone
                  raises the question it is meant to answer (FIX_BACKLOG 2.9). */}
              {instance.amountOverridden && instance.ruleAmount != null && (
                <span className="text-micro text-ink-muted">
                  this month · usually <span className="num">{formatMoney(instance.ruleAmount)}</span>
                </span>
              )}
            </span>
          )
        }
        action={
          // Settle records (or links) a payment; a bill with no amount needs a number
          // first, and "Estimate" gets it one without pretending money has moved.
          unknownAmount ? (
            <Button size="sm" variant="secondary" onClick={() => setEstimating((v) => !v)} aria-expanded={estimating}>
              Estimate
            </Button>
          ) : (
            // One action on the row. Skipping is a rarer, considered decision, so it lives on the
            // commitment's own page (tap the row) beside Settle - 2026-11-11, the user: "it
            // should be inside when the item is opened".
            <Button size="sm" variant="secondary" onClick={() => dispatch(openSettleSheet(instance.id))}>
              {instance.settleAs === 'EXPENSE' ? 'Settle' : 'Record it'}
            </Button>
          )
        }
      />
      {unknownAmount && estimating && (
        <div className="border-b border-line pb-space-3 pl-[56px]">
          <InstanceAmountForm instanceId={instance.id} name={instance.commitmentName} />
        </div>
      )}
    </Fragment>
  );
}

/** One paid (or skipped) bill - what it cost against the plan, and when and from where it left. */
export function SettledRow({ instance, onEdit }: { instance: CommitmentInstanceResponse; onEdit: () => void }) {
  const [unskip, { isLoading }] = useUnskipCommitmentInstanceMutation();
  if (instance.status === 'SKIPPED') {
    return (
      <WorklistRow
        instanceId={instance.id}
        tone="skipped"
        onEdit={onEdit}
        primary={instance.commitmentName}
        // The reason leads: it is what this row is for once the month is looked back on.
        secondary={
          instance.skipReason
            ? `Skipped · ${SKIP_REASON_LABEL[instance.skipReason]}`
            : "Skipped this month - not counted against what's free"
        }
        meta={
          <MetaFacts
            items={[
              { label: 'Was due', value: formatShortDate(instance.dueDate) },
              ...(instance.skipNote ? [{ label: 'Note', value: instance.skipNote }] : []),
            ]}
          />
        }
        amount={<Amount value={instance.expectedAmount} role="row" className="text-ink-muted line-through" />}
        action={
          <Button size="sm" variant="ghost" disabled={isLoading} onClick={() => unskip(instance.id)}>
            Undo
          </Button>
        }
      />
    );
  }
  return (
    <WorklistRow
      instanceId={instance.id}
      tone="paid"
      onEdit={onEdit}
      primary={instance.commitmentName}
      secondary={varianceNote(instance)}
      meta={
        <MetaFacts
          items={[
            // settledOn, not dueDate - labelling a due date "Paid on" states
            // a date the money did not actually move on.
            ...(instance.settledOn ? [{ label: 'Paid on', value: formatShortDate(instance.settledOn) }] : []),
            // The account the money actually left, not the one the bill plans on - they are
            // allowed to differ, so printing the plan's would misreport the payment.
            { label: 'Paid from', value: (instance.settledFromAccount ?? instance.account).name },
          ]}
        />
      }
      // Green, not grey: the row is already muted to say "nothing to do here", and the
      // figure is the one thing worth seeing at a glance when you scan the month for what
      // is done. Not struck through - a strikethrough is the language of cancellation.
      amount={<Amount value={instance.confirmedAmount} role="row" className="text-positive" />}
    />
  );
}

/** The Ledger's own type mark for a planned item: which way the money goes and what kind it
 *  is, in the same colours the Ledger uses - so a plan row and the entry that settles it look
 *  related. */
export function PlanMark({ instance }: { instance: CommitmentInstanceResponse }) {
  return <TypeMark direction={directionOf(instance.settleAs)} type={instance.settleAs} />;
}

/** Income still to arrive this month - a row in its day, with "Received" to record it. */
export function ExpectedIncomeRow({ instance, onEdit }: { instance: CommitmentInstanceResponse; onEdit: () => void }) {
  const dispatch = useAppDispatch();
  const late = daysBetween(instance.dueDate) < 0;
  return (
    <WorklistRow
      instanceId={instance.id}
      tone="pending"
      onEdit={onEdit}
      leading={<PlanMark instance={instance} />}
      primary={instance.commitmentName}
      secondary={late ? 'Expected by now · arrived? Record it' : 'Coming in · not counted until it arrives'}
      meta={<MetaFacts items={[{ label: 'Into', value: instance.account.name }]} />}
      amount={
        instance.expectedAmount == null ? (
          <span className="text-caption text-attention">Amount unknown</span>
        ) : (
          <Amount value={instance.outstanding} role="row" signed className="text-positive" />
        )
      }
      action={
        <Button size="sm" variant="secondary" onClick={() => dispatch(openSettleSheet(instance.id))}>
          Received
        </Button>
      }
    />
  );
}

/** Income that has arrived - it belongs with what is done, not at the head of the to-do list. */
export function ReceivedIncomeRow({ instance, onEdit }: { instance: CommitmentInstanceResponse; onEdit: () => void }) {
  return (
    <WorklistRow
      instanceId={instance.id}
      tone="paid"
      doneLabel="Received"
      onEdit={onEdit}
      primary={instance.commitmentName}
      secondary={
        instance.variance == null || Number(instance.variance) === 0
          ? 'Arrived as expected'
          : `${varianceNote(instance)?.replace('than planned', 'than expected')}`
      }
      meta={
        <MetaFacts
          items={[
            ...(instance.settledOn ? [{ label: 'Arrived', value: formatShortDate(instance.settledOn) }] : []),
            { label: 'Into', value: instance.account.name },
          ]}
        />
      }
      amount={<Amount value={instance.confirmedAmount} role="row" signed className="text-positive" />}
    />
  );
}

const WEEKDAY = new Intl.DateTimeFormat('en-IN', { weekday: 'long' });

/**
 * A day in the month's worklist, drawn like the Ledger's day header (2026-11-11: the user liked
 * the Ledger and asked for Month to read the same way): the day of the month as a figure, the
 * weekday and how far off it is beneath, a rule out to what is still to pay that day.
 *
 * <p>Amber when the day has passed with something unsettled, accent for today and tomorrow.
 * Sticky, because `<main>` scrolls and a long day should keep its date on screen.
 */
export function PlanDayHeader({ date, figure, caption }: { date: string; figure?: ReactNode; caption?: string }) {
  const d = new Date(`${date}T00:00:00`);
  const days = daysBetween(date);
  const overdue = days < 0;
  const soon = days === 0 || days === 1;
  const relative =
    days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : overdue ? `${-days} ${days === -1 ? 'day' : 'days'} overdue` : `in ${days} days`;
  const tone = overdue ? 'text-attention' : soon ? 'text-accent' : 'text-ink';
  return (
    <div className="sticky top-0 z-10 -mx-space-2 mb-space-1 flex items-center gap-space-3 bg-ground px-space-2 pb-space-2 pt-space-3">
      <span className={cn('num shrink-0 text-section leading-none', tone)} aria-hidden>
        {d.getDate()}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn('truncate text-label', tone)}>{WEEKDAY.format(d)}</span>
        <span className={cn('truncate text-caption', overdue ? 'text-attention' : 'text-ink-muted')}>{relative}</span>
      </span>
      <span aria-hidden className={cn('h-px flex-1', overdue ? 'bg-attention/30' : soon ? 'bg-accent/30' : 'bg-line')} />
      {figure && (
        <span className="flex shrink-0 flex-col items-end leading-tight">
          {figure}
          {caption && <span className="text-micro text-ink-muted">{caption}</span>}
        </span>
      )}
    </div>
  );
}

const BAND_DATE = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

/** "Mon, 5 Oct", with "today" / "tomorrow" where that's quicker to read. */
export function bandDate(iso: string): string {
  const days = daysBetween(iso);
  const label = BAND_DATE.format(new Date(`${iso}T00:00:00`));
  if (days === 0) return `Today · ${label}`;
  if (days === 1) return `Tomorrow · ${label}`;
  return label;
}
