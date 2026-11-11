import { useState } from 'react';
import { ListChecks, Plus, Tags } from 'lucide-react';
import { Button } from '@/components/Button';
import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { GroupBand } from '@/components/GroupBand';
import { Disclosure } from '@/components/Disclosure';
import { AddCommitmentSheet } from '@/features/plan/components/AddCommitmentSheet';
import { EditCommitmentSheet } from '@/features/plan/components/EditCommitmentSheet';
import { ManageCategoriesSheet } from '@/features/ledger/components/ManageCategoriesSheet';
import { StoppedBills, useStoppedBills } from '@/features/plan/components/StoppedBills';
import { SettledRow, UnsettledRow, ExpectedIncomeRow, ReceivedIncomeRow, PlanDayHeader } from './PlanRows';
import { daysBetween } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/cn';
import { useGetMeQuery } from '@/services/userService';
import type { CommitmentInstanceResponse, CommitmentPlanProgressResponse } from '@/types/commitment';
import type { CycleResponse } from '@/types/cycle';

interface PlanZoneProps {
  cycle?: CycleResponse;
  instances: CommitmentInstanceResponse[] | undefined;
  progress: CommitmentPlanProgressResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  /** "Coming up" for the month in progress; "The plan" for any other. */
  title?: string;
}

type Grouping = 'category' | 'when';
const GROUPING_KEY = 'kosh.month.plan.grouping';

function readGrouping(): Grouping {
  try {
    // By date is the default: the month is read as "what leaves next". Category is a choice.
    return localStorage.getItem(GROUPING_KEY) === 'category' ? 'category' : 'when';
  } catch {
    return 'when';
  }
}

/**
 * The month's worklist (UI_UX_REVAMP_PLAN 4.5): **what is still to do, by date**, with what is
 * already done folded away. Done items are reassurance, not work - they sit under a closed "Done"
 * section rather than between the things that need acting on.
 *
 * <p>In the by-date view each band shows the server's *outstanding* total for its date (what is still
 * to pay), and only counts the rows in front of the reader. The by-category view is a review lens
 * and keeps paid rows inline.
 */
export function PlanZone({ cycle, instances: allInstances, progress, isLoading, isError, title = 'The plan' }: PlanZoneProps) {
  const [adding, setAdding] = useState(false);
  const [addingIncome, setAddingIncome] = useState<'salary' | 'extra' | null>(null);
  const { data: me } = useGetMeQuery();
  const [editing, setEditing] = useState<CommitmentInstanceResponse | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);
  const [showStopped, setShowStopped] = useState(false);
  const stoppedBills = useStoppedBills();
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
        <SectionHeader>{title}</SectionHeader>
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
        <SectionHeader>{title}</SectionHeader>
        <p className="text-body text-ink-soft">We couldn’t load this cycle’s commitments. Refresh to try again.</p>
      </section>
    );
  }

  // Adding from a month's plan starts the commitment in that month - planning October from
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
        <SectionHeader>{title}</SectionHeader>
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
  // Income is part of the month's timeline, not a block above it (2026-11-11): what is still to
  // arrive sits in its day like any other row; what has arrived is done, so it goes to Done.
  const income = allInstances.filter((i) => i.settleAs === 'INCOME');
  const expectedIncome = income.filter((i) => i.attentionTier !== 'SETTLED');
  const receivedIncome = income.filter((i) => i.attentionTier === 'SETTLED');
  const instances = allInstances.filter((i) => i.settleAs !== 'INCOME');
  const unsettled = instances.filter((i) => i.attentionTier !== 'SETTLED');
  const settled = instances.filter((i) => i.attentionTier === 'SETTLED');
  // Done, in date order, income and commitments together.
  const done = [...settled, ...receivedIncome].sort(byDueDate);
  // Needs the server's per-category subtotals. Until they arrive - or while they lag a
  // just-edited commitment, so a row would have no heading to sit under - show the by-date view
  // rather than drop a commitment from the list.
  const groupIds = new Set(progress?.byCategory.map((g) => g.category?.id ?? null));
  const byCategory =
    grouping === 'category' && progress && instances.every((i) => groupIds.has(i.category?.id ?? null))
      ? progress.byCategory
      : null;
  // "By date": one day per due date that still has something to do. The day's figure is the
  // server's outstanding total; if it lags a just-edited commitment the day still shows, without it.
  const openDates = [...new Set([...unsettled, ...expectedIncome].map((i) => i.dueDate))].sort();
  const serverDates = new Map((progress?.byDueDate ?? []).map((g) => [g.dueDate, g]));

  // The Ledger's toolbar, so the two pages work the same way: a segmented control for the view,
  // and quiet tools to its right - icon-only on a phone.
  const CHIP = 'h-8 rounded-full border text-label transition-colors duration-150 pointer-coarse:h-9';
  const toolbar = (
    <div className="mb-space-2 flex flex-wrap items-center gap-space-2">
      <span className={cn('inline-flex overflow-hidden border-border', CHIP)} role="group" aria-label="Group the plan">
        {(['when', 'category'] as const).map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={grouping === g}
            onClick={() => setGrouping(g)}
            className={cn(
              'px-space-3 transition-colors duration-150',
              grouping === g ? 'bg-accent-wash font-medium text-ink' : 'text-ink-soft hover:bg-sunken',
            )}
          >
            {g === 'category' ? 'By category' : 'By date'}
          </button>
        ))}
      </span>
      {/* Only when there is something stopped - an always-on "0 stopped" would be noise. */}
      {stoppedBills.length > 0 && (
        <button
          type="button"
          aria-expanded={showStopped}
          onClick={() => setShowStopped((v) => !v)}
          className={cn(CHIP, 'px-space-3', showStopped ? 'border-ink-soft bg-sunken text-ink' : 'border-border text-ink-soft hover:bg-sunken')}
        >
          {stoppedBills.length} stopped
        </button>
      )}
      <span className="ml-auto flex items-center gap-space-2">
        <button
          type="button"
          onClick={() => setManagingCategories(true)}
          aria-label="Categories"
          title="Categories"
          className={cn(CHIP, 'flex items-center gap-space-1 border-border px-space-3 text-ink-soft hover:bg-sunken max-md:w-8 max-md:justify-center max-md:px-0 pointer-coarse:max-md:w-9')}
        >
          <Tags size={15} strokeWidth={1.5} aria-hidden />
          <span className="max-md:sr-only">Categories</span>
        </button>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={cn(CHIP, 'flex items-center gap-space-1 border-accent px-space-3 font-medium text-accent hover:bg-accent-wash')}
        >
          <Plus size={15} strokeWidth={1.75} aria-hidden />
          Add
        </button>
      </span>
    </div>
  );

  const incomeNote =
    income.length === 0 ? (
      <p className="mt-space-4 text-caption text-ink-soft">
        No salary in this plan yet, so the month can’t be set against what comes in.{' '}
        <button type="button" onClick={() => setAddingIncome('salary')} className="text-accent underline-offset-4 hover:underline">
          Add your salary
        </button>
      </p>
    ) : (
      <button
        type="button"
        onClick={() => setAddingIncome('extra')}
        className="mt-space-4 self-start text-caption text-accent underline-offset-4 hover:underline"
      >
        + Extra income this month (bonus, arrears…)
      </button>
    );

  return (
    <section>
      <SectionHeader rule={false} className="mb-space-2">
        {title}
      </SectionHeader>
      {toolbar}

      {showStopped && <StoppedBills bills={stoppedBills} onClose={() => setShowStopped(false)} />}

      {byCategory ? (
        <div className="flex flex-col gap-space-6 md:gap-space-8">
          {income.length > 0 && (
            <div className="flex flex-col">
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
              {expectedIncome.sort(byDueDate).map((instance) => (
                <ExpectedIncomeRow key={instance.id} instance={instance} onEdit={edit(instance)} />
              ))}
              {receivedIncome.sort(byDueDate).map((instance) => (
                <ReceivedIncomeRow key={instance.id} instance={instance} onEdit={edit(instance)} />
              ))}
            </div>
          )}
          {byCategory.map((group) => {
            const categoryId = group.category?.id ?? null;
            const inGroup = (i: CommitmentInstanceResponse) => (i.category?.id ?? null) === categoryId;
            const open = unsettled.filter(inGroup).sort(byDueDate);
            const paid = settled.filter(inGroup).sort(byDueDate);
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
          {incomeNote}
        </div>
      ) : (
        <div className="flex flex-col">
          {openDates.length === 0 ? (
            <p className="py-space-3 text-body text-ink-soft">Everything in this month’s plan is dealt with.</p>
          ) : (
            <div className="flex flex-col gap-space-4 md:gap-space-6">
              {openDates.map((dueDate) => {
                const open = unsettled.filter((i) => i.dueDate === dueDate);
                const arriving = expectedIncome.filter((i) => i.dueDate === dueDate);
                const server = serverDates.get(dueDate);
                const passed = daysBetween(dueDate) < 0;
                return (
                  <div key={dueDate} className="flex flex-col">
                    <PlanDayHeader
                      date={dueDate}
                      figure={
                        open.length > 0 && server?.outstandingTotal != null ? (
                          <Amount
                            value={server.outstandingTotal}
                            role="caption"
                            className={cn('font-medium', passed ? 'text-attention' : 'text-ink')}
                          />
                        ) : undefined
                      }
                      caption={open.length > 0 ? (passed ? 'not settled' : 'to pay') : undefined}
                    />
                    {arriving.map((instance) => (
                      <ExpectedIncomeRow key={instance.id} instance={instance} onEdit={edit(instance)} />
                    ))}
                    {open.map((instance) => (
                      <UnsettledRow key={instance.id} instance={instance} onEdit={edit(instance)} />
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {incomeNote}

          {done.length > 0 && (
            <div className="mt-space-6 md:mt-space-8">
              <Disclosure storageKey="kosh.month.done" label={`Done · ${done.length}`} summary="paid, received or skipped">
                <div className="flex flex-col">
                  {done.map((instance) =>
                    instance.settleAs === 'INCOME' ? (
                      <ReceivedIncomeRow key={instance.id} instance={instance} onEdit={edit(instance)} />
                    ) : (
                      <SettledRow key={instance.id} instance={instance} onEdit={edit(instance)} />
                    ),
                  )}
                </div>
              </Disclosure>
            </div>
          )}
        </div>
      )}

      {addSheet}
      <EditCommitmentSheet
        commitmentId={editing?.commitmentId ?? null}
        instanceId={editing?.id ?? null}
        instanceAmount={editing?.expectedAmount ?? null}
        instanceDueDate={editing?.dueDate ?? null}
        instanceOverridden={editing?.amountOverridden ?? false}
        onClose={() => setEditing(null)}
      />
      <ManageCategoriesSheet open={managingCategories} onClose={() => setManagingCategories(false)} />
    </section>
  );
}
