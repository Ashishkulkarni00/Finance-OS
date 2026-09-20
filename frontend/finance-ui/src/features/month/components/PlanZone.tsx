import { Fragment, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { Button } from '@/components/Button';
import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { ProgressRule } from '@/components/ProgressRule';
import { GroupBand } from '@/components/GroupBand';
import { DateBlock } from '@/components/DateBlock';
import { MetaFacts } from '@/components/LedgerRow';
import { InstanceAmountForm } from '@/features/commitments/components/InstanceAmountForm';
import { AddCommitmentSheet } from '@/features/plan/components/AddCommitmentSheet';
import { EditCommitmentSheet } from '@/features/plan/components/EditCommitmentSheet';
import { ManageCategoriesSheet } from '@/features/ledger/components/ManageCategoriesSheet';
import { WorklistRow } from './WorklistRow';
import { PlanChanges } from './PlanChanges';
import { formatShortDate, daysBetween } from '@/lib/dates';
import { formatMoney, splitMoney } from '@/lib/money';
import { cn } from '@/lib/cn';
import { useAppDispatch } from '@/store/hooks';
import { openSettleSheet } from '@/store/slices/uiSlice';
import { useSkipCommitmentInstanceMutation, useUnskipCommitmentInstanceMutation } from '@/services/commitmentInstanceService';
import { useGetMeQuery } from '@/services/userService';
import type { CommitmentInstanceResponse, CommitmentPlanProgressResponse } from '@/types/commitment';
import type { CycleResponse } from '@/types/cycle';

interface PlanZoneProps {
  /** The month being shown - new bills added from here start in it. */
  cycle?: CycleResponse;
  instances: CommitmentInstanceResponse[] | undefined;
  progress: CommitmentPlanProgressResponse | undefined;
  isLoading: boolean;
  isError: boolean;
}

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
 * One unsettled bill. Its own component because a bill with no amount can open an
 * inline estimate form under the row, and that toggle is per row.
 *
 * <p>Rendered as a Fragment, not wrapped in a div: `LedgerRow` rules itself off with
 * `last:border-b-0`, so a wrapper per row would make every row its wrapper's last child
 * and erase every rule in the list.
 */
function UnsettledRow({ instance, onEdit }: { instance: CommitmentInstanceResponse; onEdit: () => void }) {
  const dispatch = useAppDispatch();
  const [skip, { isLoading: skipping }] = useSkipCommitmentInstanceMutation();
  const [estimating, setEstimating] = useState(false);
  const due = duePhrase(instance.dueDate);
  const unknownAmount = instance.expectedAmount == null;
  const passed = due.tone === 'overdue';

  const secondary = passed
    ? unknownAmount
      ? 'Due date passed · needs an amount'
      : 'Due date passed · paid already? Settle it, or link the Ledger entry'
    : instance.sourceType === 'LOAN'
      ? 'Loan EMI · amount and dates follow the loan'
      : instance.ifSkipped
        ? `If skipped: ${instance.ifSkipped}`
        : instance.mandatory
          ? 'Mandatory'
          : 'Optional';

  return (
    <Fragment>
      <WorklistRow
        instanceId={instance.id}
        tone="pending"
        onEdit={onEdit}
        leading={<DateBlock date={instance.dueDate} tone={due.tone} />}
        primary={instance.commitmentName}
        secondary={secondary}
        meta={
          <MetaFacts
            items={[
              { label: 'Due', value: due.value, className: passed ? 'text-attention' : undefined },
              { label: 'Pay from', value: instance.account.name },
            ]}
          />
        }
        amount={
          unknownAmount ? (
            <span className="text-caption text-attention">Amount unknown</span>
          ) : (
            <Amount value={instance.outstanding} role="row" className="text-ink" />
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
            <span className="flex items-center gap-space-2">
              {/* An optional bill you won't pay this month frees its money - only while untouched. */}
              {!instance.mandatory && instance.confirmedAmount == null && (
                <Button size="sm" variant="ghost" disabled={skipping} onClick={() => skip(instance.id)}>
                  Skip
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => dispatch(openSettleSheet(instance.id))}>
                {instance.settleAs === 'EXPENSE' ? 'Settle' : 'Record it'}
              </Button>
            </span>
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
function SettledRow({ instance, onEdit }: { instance: CommitmentInstanceResponse; onEdit: () => void }) {
  const [unskip, { isLoading }] = useUnskipCommitmentInstanceMutation();
  if (instance.status === 'SKIPPED') {
    return (
      <WorklistRow
        instanceId={instance.id}
        tone="completed"
        onEdit={onEdit}
        primary={instance.commitmentName}
        secondary="Skipped this month - not counted against what's free"
        meta={<MetaFacts items={[{ label: 'Was due', value: formatShortDate(instance.dueDate) }]} />}
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
      tone="completed"
      onEdit={onEdit}
      primary={instance.commitmentName}
      secondary={varianceNote(instance)}
      meta={
        <MetaFacts
          items={[
            // settledOn, not dueDate - labelling a due date "Paid on" states
            // a date the money did not actually move on.
            ...(instance.settledOn ? [{ label: 'Paid on', value: formatShortDate(instance.settledOn) }] : []),
            { label: 'Paid from', value: instance.account.name },
          ]}
        />
      }
      amount={<Amount value={instance.confirmedAmount} role="row" className="text-ink-muted" />}
    />
  );
}

/**
 * "Coming in" - the month's expected income, above the bills it pays for. Expected until
 * it's recorded; then what arrived, with how it compared. Never a bill: no Skip, no
 * "pay from", and it isn't in the plan's settled count.
 */
function IncomeBlock({
  income,
  progress,
  onEdit,
  onAdd,
  onAddExtra,
}: {
  income: CommitmentInstanceResponse[];
  progress: CommitmentPlanProgressResponse | undefined;
  onEdit: (instance: CommitmentInstanceResponse) => () => void;
  onAdd: () => void;
  /** A one-off this month - a bonus, arrears, a deposit coming back. */
  onAddExtra: () => void;
}) {
  const dispatch = useAppDispatch();
  if (income.length === 0) {
    return (
      <p className="mb-space-6 text-caption text-ink-soft">
        No salary in this plan yet, so the month can’t be set against what comes in.{' '}
        <button type="button" onClick={onAdd} className="text-accent underline-offset-4 hover:underline">
          Add your salary
        </button>
      </p>
    );
  }
  return (
    <div className="mb-space-8 flex flex-col">
      <GroupBand
        label="Coming in"
        count={income.length}
        figure={
          progress && (
            <Amount
              value={Number(progress.incomeExpectedTotal) > 0 ? progress.incomeExpectedTotal : progress.incomeReceivedTotal}
              role="caption"
              className="text-ink"
            />
          )
        }
        caption={progress && Number(progress.incomeExpectedTotal) > 0 ? 'still expected' : 'arrived'}
      />
      <button
        type="button"
        onClick={onAddExtra}
        className="self-start py-space-2 text-caption text-accent underline-offset-4 hover:underline"
      >
        + Extra income this month (bonus, arrears…)
      </button>
      {income
        .slice()
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .map((instance) => {
          const received = instance.attentionTier === 'SETTLED';
          const late = !received && daysBetween(instance.dueDate) < 0;
          return received ? (
            <WorklistRow
              key={instance.id}
              instanceId={instance.id}
              tone="completed"
              onEdit={onEdit(instance)}
              primary={instance.commitmentName}
              secondary={instance.variance == null || Number(instance.variance) === 0 ? 'Arrived as expected' : `${varianceNote(instance)?.replace('than planned', 'than expected')}`}
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
          ) : (
            <WorklistRow
              key={instance.id}
              instanceId={instance.id}
              tone="pending"
              onEdit={onEdit(instance)}
              leading={<DateBlock date={instance.dueDate} tone={late ? 'overdue' : 'neutral'} />}
              primary={instance.commitmentName}
              secondary={
                late
                  ? 'Expected by now - arrived? Record it, or link the Ledger entry'
                  : 'Expected - counted in this month’s standing, not in what you can spend'
              }
              meta={
                <MetaFacts
                  items={[
                    { label: 'Expected', value: duePhrase(instance.dueDate).value, className: late ? 'text-attention' : undefined },
                    { label: 'Into', value: instance.account.name },
                  ]}
                />
              }
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
        })}
    </div>
  );
}

const BAND_DATE = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

/** "Mon, 5 Oct", with "today" / "tomorrow" where that's quicker to read. */
function bandDate(iso: string): string {
  const days = daysBetween(iso);
  const label = BAND_DATE.format(new Date(`${iso}T00:00:00`));
  if (days === 0) return `Today · ${label}`;
  if (days === 1) return `Tomorrow · ${label}`;
  return label;
}

type Grouping = 'category' | 'when';
const GROUPING_KEY = 'kosh.month.plan.grouping';

/** The chosen grouping is a per-browser convenience; forgetting it costs one click. */
function readGrouping(): Grouping {
  try {
    // By date is the default: the month is read as "what leaves next". Category is a choice.
    return localStorage.getItem(GROUPING_KEY) === 'category' ? 'category' : 'when';
  } catch {
    return 'when';
  }
}

/**
 * Zone 4 - "the plan": every bill in this cycle, not only the ones still ahead.
 *
 * <p>This used to list Tier 2 (Worth knowing) and Tier 3 (Settled) and leave Tier 1 to
 * the Needs You cards above - so a bill whose due date had passed unpaid appeared only
 * as an alert, and the plan itself read as "future bills". That broke the plan's one
 * job: MONTH_EXPERIENCE's rule is that Month shows *completeness* - every obligation in
 * the cycle, with its status. Needs You is the urgent shortlist on top of that; it
 * doesn't replace any of it. So the list is grouped by when, not by tier:
 * <ol>
 *   <li><strong>Due date passed</strong> - unsettled and past due: including a bill added
 *       after its date, which is exactly the case people forget to record.</li>
 *   <li><strong>Still to come</strong></li>
 *   <li><strong>Settled</strong></li>
 * </ol>
 *
 * <p>Grouped <strong>by date</strong> by default (2026-09-18): one band per due date, in
 * order, each with the server's planned and still-to-pay figures (`progress.byDueDate`) -
 * the month read as "what leaves next". Within a band, unpaid bills first, then paid.
 * "By category" groups the same bills under the Ledger's categories
 * (`progress.byCategory`), with uncategorised bills last.
 */
export function PlanZone({ cycle, instances: allInstances, progress, isLoading, isError }: PlanZoneProps) {
  const [adding, setAdding] = useState(false);
  const [addingIncome, setAddingIncome] = useState<'salary' | 'extra' | null>(null);
  const { data: me } = useGetMeQuery();
  /** The occurrence whose pencil was clicked - Edit changes its commitment, and "This time" is its own amount. */
  const [editing, setEditing] = useState<CommitmentInstanceResponse | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);
  const [grouping, setGroupingState] = useState<Grouping>(readGrouping);
  const setGrouping = (next: Grouping) => {
    setGroupingState(next);
    try {
      localStorage.setItem(GROUPING_KEY, next);
    } catch {
      // Remembered for this visit only.
    }
  };

  if (isLoading) {
    return (
      <section>
        <SectionHeader>The plan</SectionHeader>
        <div className="flex flex-col gap-space-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </section>
    );
  }

  // A failed request is not an empty cycle - never tell someone with bills they have none.
  if (isError) {
    return (
      <section>
        <SectionHeader>The plan</SectionHeader>
        <p className="text-body text-ink-soft">We couldn’t load this cycle’s bills. Refresh to try again.</p>
      </section>
    );
  }

  // Adding from a month's plan starts the bill in that month - planning October from
  // October's page shouldn't need the start picked again.
  const addSheet = (
    <>
      <AddCommitmentSheet open={adding} onClose={() => setAdding(false)} defaultStart={cycle?.startDate} />
      <AddCommitmentSheet
        // Keyed so switching between salary and an extra starts from the right values.
        key={addingIncome ?? 'none'}
        open={addingIncome != null}
        onClose={() => setAddingIncome(null)}
        defaultStart={cycle?.startDate}
        preset={
          addingIncome === 'extra'
            ? { kind: 'INCOME', name: 'Bonus', once: true }
            : { kind: 'INCOME', name: 'Salary', dueDay: me?.cycleStartDay }
        }
      />
    </>
  );

  if (!allInstances || allInstances.length === 0) {
    return (
      <section>
        <SectionHeader>The plan</SectionHeader>
        <EmptyState
          icon={ListChecks}
          headline="No commitments in this month yet."
          body="Add what leaves your account every month - rent, EMIs, subscriptions, family support - and your salary coming in. The rest builds itself."
          action={
            <Button variant="secondary" onClick={() => setAdding(true)}>
              Add a commitment
            </Button>
          }
        />
        {addSheet}
      </section>
    );
  }

  const byDueDate = (a: CommitmentInstanceResponse, b: CommitmentInstanceResponse) => a.dueDate.localeCompare(b.dueDate);
  const edit = (instance: CommitmentInstanceResponse) => () => setEditing(instance);
  // Expected income has its own block; everything below is bills.
  const income = allInstances.filter((i) => i.settleAs === 'INCOME');
  const instances = allInstances.filter((i) => i.settleAs !== 'INCOME');
  const unsettled = instances.filter((i) => i.attentionTier !== 'SETTLED');
  const settled = instances.filter((i) => i.attentionTier === 'SETTLED').sort(byDueDate);
  // Needs the server's per-category subtotals. Until they arrive - or while they lag a
  // just-edited bill, so a row would have no heading to sit under - show the timing view
  // rather than drop a bill from the list.
  const groupIds = new Set(progress?.byCategory.map((g) => g.category?.id ?? null));
  const byCategory =
    grouping === 'category' && progress && instances.every((i) => groupIds.has(i.category?.id ?? null))
      ? progress.byCategory
      : null;
  // "By when": one band per due date. The figures are the server's; if they lag a just-edited
  // bill, the bands still show (dates are known here) but without money figures.
  const billDates = [...new Set(instances.map((i) => i.dueDate))].sort();
  const serverDates = new Map((progress?.byDueDate ?? []).map((g) => [g.dueDate, g]));
  const dateGroups: { dueDate: string; count: number; plannedTotal?: string; outstandingTotal?: string }[] = billDates.every((d) =>
    serverDates.has(d),
  )
    ? billDates.map((d) => serverDates.get(d)!)
    : billDates.map((d) => ({ dueDate: d, count: instances.filter((i) => i.dueDate === d).length }));

  return (
    <section>
      <SectionHeader
        // The settled-progress rule sits directly beneath this; a second hairline above
        // it just doubles the line.
        rule={false}
        trailing={
          <span className="flex items-baseline gap-space-4">
            {progress && (
              <span className="num">
                <Amount value={progress.settledTotal} role="caption" className="text-ink-muted" /> of{' '}
                <Amount value={progress.plannedTotal} role="caption" className="text-ink-muted" /> settled ·{' '}
                {progress.settledCount} of {progress.totalCount}
              </span>
            )}
            <span className="flex items-baseline gap-space-2" role="group" aria-label="Group the plan">
              {(['when', 'category'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={grouping === g}
                  onClick={() => setGrouping(g)}
                  className={cn('underline-offset-4 hover:underline', grouping === g ? 'font-medium text-ink' : 'text-ink-muted')}
                >
                  {g === 'category' ? 'By category' : 'By date'}
                </button>
              ))}
            </span>
            <button type="button" onClick={() => setManagingCategories(true)} className="text-accent underline-offset-4 hover:underline">
              Manage categories
            </button>
            <button type="button" onClick={() => setAdding(true)} className="text-accent underline-offset-4 hover:underline">
              + Add a commitment
            </button>
          </span>
        }
      >
        The plan
      </SectionHeader>

      <PlanChanges cycle={cycle} />

      <IncomeBlock
        income={income}
        progress={progress}
        onEdit={edit}
        onAdd={() => setAddingIncome('salary')}
        onAddExtra={() => setAddingIncome('extra')}
      />

      {progress && (
        // Counts, not money - a ratio of two integers is safe to take here.
        <ProgressRule
          className="mb-space-6"
          fraction={progress.totalCount > 0 ? progress.settledCount / progress.totalCount : 0}
        />
      )}

      {byCategory ? (
        <div className="flex flex-col gap-space-8">
          {byCategory.map((group) => {
            const categoryId = group.category?.id ?? null;
            const inGroup = (i: CommitmentInstanceResponse) => (i.category?.id ?? null) === categoryId;
            const open = unsettled.filter(inGroup).sort(byDueDate);
            const paid = settled.filter(inGroup);
            return (
              <div key={categoryId ?? 'none'} className="flex flex-col">
                <GroupBand
                  label={group.category?.name ?? 'No category'}
                  count={group.count}
                  figure={<Amount value={group.plannedTotal} role="caption" className="text-ink" />}
                  caption={
                    categoryId == null
                      ? 'planned · use the pencil on one to give it a category'
                      : open.length > 0
                        ? `planned · ${formatMoney(group.outstandingTotal)} still to pay`
                        : 'planned · all paid'
                  }
                />
                {open.map((instance) => (
                  <UnsettledRow key={instance.id} instance={instance} onEdit={edit(instance)} />
                ))}
                {paid.map((instance) => (
                  <SettledRow key={instance.id} instance={instance} onEdit={edit(instance)} />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-space-8">
          {dateGroups.map((group) => {
            const inGroup = (i: CommitmentInstanceResponse) => i.dueDate === group.dueDate;
            const open = unsettled.filter(inGroup);
            const paid = settled.filter(inGroup);
            const passed = daysBetween(group.dueDate) < 0;
            return (
              <div key={group.dueDate} className="flex flex-col">
                <GroupBand
                  label={bandDate(group.dueDate)}
                  count={group.count}
                  figure={group.plannedTotal != null ? <Amount value={group.plannedTotal} role="caption" className="text-ink" /> : undefined}
                  caption={
                    group.outstandingTotal == null
                      ? passed && open.length > 0 ? 'date passed · not settled yet' : undefined
                      : open.length === 0
                        ? 'planned · all settled'
                        : passed
                          ? `planned · ${formatMoney(group.outstandingTotal)} not settled - date passed`
                          : `planned · ${formatMoney(group.outstandingTotal)} still to pay`
                  }
                />
                {open.map((instance) => (
                  <UnsettledRow key={instance.id} instance={instance} onEdit={edit(instance)} />
                ))}
                {paid.map((instance) => (
                  <SettledRow key={instance.id} instance={instance} onEdit={edit(instance)} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {addSheet}
      <EditCommitmentSheet
        commitmentId={editing?.commitmentId ?? null}
        instanceId={editing?.id ?? null}
        instanceAmount={editing?.expectedAmount ?? null}
        instanceDueDate={editing?.dueDate ?? null}
        onClose={() => setEditing(null)}
      />
      <ManageCategoriesSheet open={managingCategories} onClose={() => setManagingCategories(false)} />
    </section>
  );
}
