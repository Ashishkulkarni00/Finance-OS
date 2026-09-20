import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCategoriesQuery } from '@/services/categoryService';
import { useGetCurrentCycleQuery, useLazyGetCycleForDateQuery } from '@/services/cycleService';
import {
  useGetCommitmentInstancesForCycleQuery,
  useLazyGetCommitmentInstancesForCycleQuery,
  useSetCommitmentInstanceAmountMutation,
} from '@/services/commitmentInstanceService';
import { useCreateCommitmentRuleMutation } from '@/services/commitmentRuleService';
import {
  cycleMonthName,
  firstDueOnOrAfter,
  formatDayMonthYear,
  formatShortDate,
  salaryMonthContaining,
  shiftIsoDays,
  shiftIsoMonths,
} from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { CommitmentFrequency, CommitmentResponse } from '@/types/commitmentRule';
import { handleEnterAdvance } from '@/lib/formKeyboard';
import { CommitmentFields } from './CommitmentFields';
import { PaymentMonthPicker } from './PaymentMonthPicker';
import { commitmentSchema, useLastPayment, type CommitmentFormValues } from './commitmentForm';

const VALID_AMOUNT = /^\d+(\.\d{1,2})?$/;

/** How far back and ahead a bill's start can be picked. */
const MONTHS_BACK = 6;
const MONTHS_AHEAD = 12;

/** Local calendar day, not `toISOString()` - that converts to UTC first and names
 *  yesterday for the first hours of every day east of Greenwich. */
function localIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

interface CycleOption {
  start: string;
  end: string;
  label: string;
}

/**
 * The months a bill can start in, as salary cycles: 6 back, the current one, 12 ahead.
 * Stepped from the current cycle's own start date, since every cycle starts on the same
 * salary day - date arithmetic, which is allowed client-side (lib/dates.ts). The dates
 * only ever become a bill's active window; the server generates occurrences from them
 * with its own cycle boundaries.
 */
export function cycleOptions(currentStart: string): CycleOption[] {
  const options: CycleOption[] = [];
  for (let k = -MONTHS_BACK; k <= MONTHS_AHEAD; k++) {
    const start = shiftIsoMonths(currentStart, k);
    const end = shiftIsoDays(shiftIsoMonths(currentStart, k + 1), -1);
    const name = cycleMonthName(end);
    options.push({
      start,
      end,
      label: k === 0 ? `This month - ${name}` : `${name} (${formatShortDate(start)} – ${formatShortDate(end)})`,
    });
  }
  return options;
}

/**
 * The occurrence date for a due day inside a cycle - the same pivot the server's
 * generator uses (`CommitmentInstanceGenerator.dueDateWithin`): a due day on or after the
 * cycle's start day falls in the start month, an earlier one in the month after.
 */
function cycleOccurrenceDate(cycleStart: string, dueDay: number): string {
  const [year, month, startDay] = cycleStart.split('-').map(Number) as [number, number, number];
  const monthIndex = dueDay >= startDay ? month - 1 : month;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return localIso(new Date(year, monthIndex, Math.min(dueDay, lastDay)));
}

/** The next date on or after today falling on `dueDay`, clamped to the month's length. */
function nextMonthlyDueDate(dueDay: number): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const on = (year: number, month: number) =>
    new Date(year, month, Math.min(dueDay, new Date(year, month + 1, 0).getDate()));
  let candidate = on(today.getFullYear(), today.getMonth());
  if (candidate < today) candidate = on(today.getFullYear(), today.getMonth() + 1);
  return localIso(candidate);
}

interface AddedBill {
  id: number;
  name: string;
  dueDay: number;
  frequency: CommitmentFrequency;
  mandatory: boolean;
  /** Expected income rather than a bill. */
  income: boolean;
  /** A one-off in a single month. */
  once: boolean;
  /** The first payment's date. */
  firstDue: string | null;
  /** The first payment is in a salary month after the current one. */
  startsLater: boolean;
  /** What happened to a "First amount" typed for a changing bill - null when none was typed. */
  firstAmount: { saved: true; amount: string } | { saved: false } | null;
}

interface AddCommitmentSheetProps {
  open: boolean;
  onClose: () => void;
  /** The start date of the month the sheet was opened from - where the bill starts by
   *  default. Omitted means the current month. */
  defaultStart?: string;
  /** Opened for something specific - a goal's "Fund it monthly" (the bill follows the goal
   *  and the money goes into its account), or "Add your salary" (expected income). */
  preset?: AddBillPreset;
}

export type AddBillPreset = (
  | {
      kind: 'GOAL';
      name: string;
      sourceType: 'GOAL';
      sourceId: number;
      goalName: string;
      /** The goal's account - where each month's transfer lands. */
      toAccountId: number;
    }
  | {
      kind: 'INCOME';
      name: string;
      /** Pay day, when known - the day the financial month starts. */
      dueDay?: number;
    }
  | {
      /** A payment a goal is for, on a date - a trip's bookings, or the trip itself. Paid as
       *  an expense and linked to the goal, so the goal counts it and Months plans for it. */
      kind: 'GOAL_PAYMENT';
      name: string;
      sourceId: number;
      goalName: string;
      /** Paid from the goal's own account by default, when it has one. */
      accountId?: number | null;
      amount?: string;
      /** The payment's calendar month, `YYYY-MM`. */
      month?: string;
    }
  | {
      /** Money moved to one of your own accounts or a debt - e.g. a loan prepayment. */
      kind: 'TRANSFER';
      name: string;
      toAccountId: number;
      /** How the destination is described in the locked "Paid as" row. */
      toLabel: string;
    }
) & {
  /** Start as a one-off ("Just once") rather than every month. */
  once?: boolean;
};

const EMPTY: CommitmentFormValues = {
  name: '',
  amountType: 'FIXED',
  fixedAmount: '',
  frequency: 'MONTHLY',
  dueDay: '',
  accountId: undefined as unknown as number,
  settleAs: 'EXPENSE',
  toAccountId: null,
  categoryId: null,
  mandatory: true,
  why: '',
  ifSkipped: '',
};

/**
 * "Add a commitment" - a new rent, EMI, subscription or family obligation, starting in
 * any month: a past one it was really running in, this one, or one still being planned.
 *
 * <p>Two choices make a bill plannable rather than only recordable:
 * <ul>
 *   <li><strong>Starts</strong> - the month it begins. It used to be fixed to "now", so
 *       October's rent could only be added once October arrived.</li>
 *   <li><strong>Last payment</strong> - optional. A bill that ends (an EMI, a course fee)
 *       stops generating after its final payment.</li>
 * </ul>
 * The rest of the fields are {@link CommitmentFields}, shared with "Edit bill".
 *
 * <p>After saving, the sheet says where the bill went. Whether it landed in this month's
 * plan is read from the server's own list of occurrences, not guessed.
 */
export function AddCommitmentSheet({ open, onClose, defaultStart, preset }: AddCommitmentSheetProps) {
  const [added, setAdded] = useState<AddedBill | null>(null);
  /** Whether the start month's bill counts when its due date has already passed. */
  const [countThisCycle, setCountThisCycle] = useState(true);
  /** The first payment's calendar month, `YYYY-MM`; '' means the one in the month the sheet was opened from. */
  const presetMonth = preset?.kind === 'GOAL_PAYMENT' ? (preset.month ?? '') : '';
  const [firstMonth, setFirstMonth] = useState(presetMonth);
  /** A changing bill's first amount, if already known - '' leaves it "amount unknown". */
  const [firstAmount, setFirstAmount] = useState('');
  const [firstAmountError, setFirstAmountError] = useState<string | null>(null);

  const { data: accountsPage } = useGetAccountsQuery();
  const { data: categoriesPage } = useGetCategoriesQuery();
  const { data: cycle } = useGetCurrentCycleQuery();
  const { data: instances, isFetching: checkingPlan } = useGetCommitmentInstancesForCycleQuery(cycle?.id ?? 0, {
    skip: !cycle || !added,
  });
  const [createCommitment, { isLoading: creating }] = useCreateCommitmentRuleMutation();
  const [resolveCycle] = useLazyGetCycleForDateQuery();
  const [loadInstances] = useLazyGetCommitmentInstancesForCycleQuery();
  const [setInstanceAmount, { isLoading: savingAmount }] = useSetCommitmentInstanceAmountMutation();
  const isLoading = creating || savingAmount;

  // Every usable account and category - the fields offer the ones that fit how it's paid.
  const accounts = accountsPage?.content.filter((a) => !a.archived) ?? [];
  const categories = categoriesPage?.content.filter((c) => !c.archived) ?? [];

  const base: CommitmentFormValues = preset?.once ? { ...EMPTY, frequency: 'ONCE' } : EMPTY;
  const initial: CommitmentFormValues =
    preset?.kind === 'GOAL' || preset?.kind === 'TRANSFER'
      ? { ...base, name: preset.name, settleAs: 'TRANSFER', toAccountId: preset.toAccountId }
      : preset?.kind === 'GOAL_PAYMENT'
        ? {
            ...base,
            name: preset.name,
            settleAs: 'EXPENSE',
            ...(preset.accountId ? { accountId: preset.accountId } : {}),
            ...(preset.amount ? { fixedAmount: preset.amount } : {}),
          }
      : preset?.kind === 'INCOME'
        ? { ...base, name: preset.name, settleAs: 'INCOME', dueDay: preset.dueDay ? String(Math.min(preset.dueDay, 28)) : '' }
        : base;
  const form = useForm<CommitmentFormValues>({
    resolver: zodResolver(commitmentSchema),
    defaultValues: initial,
  });
  const { handleSubmit, watch, reset, setError } = form;

  const today = localIso(new Date());
  const isIncome = watch('settleAs') === 'INCOME';
  const once = watch('frequency') === 'ONCE';

  // The first payment is picked as a calendar month and shown as a real date ("5 Oct 2026");
  // the salary month it falls in - what the server needs - is worked out from that date.
  const viewedStart = defaultStart || cycle?.startDate || null;
  const enteredDueDay = Number(watch('dueDay'));
  const validDueDay = Number.isInteger(enteredDueDay) && enteredDueDay >= 1 && enteredDueDay <= 28;
  const defaultFirstDue = viewedStart && validDueDay ? cycleOccurrenceDate(viewedStart, enteredDueDay) : null;
  const pickerMonth =
    firstMonth || defaultFirstDue?.slice(0, 7) || (viewedStart ? shiftIsoDays(shiftIsoMonths(viewedStart, 1), -1).slice(0, 7) : today.slice(0, 7));
  const firstDue = validDueDay ? `${pickerMonth}-${String(enteredDueDay).padStart(2, '0')}` : null;
  const firstCycle = firstDue && cycle ? salaryMonthContaining(cycle.startDate, firstDue) : undefined;
  const startIsCurrent = firstCycle != null && cycle != null && firstCycle.start === cycle.startDate;
  const startsLater = firstCycle != null && cycle != null && firstCycle.start > cycle.startDate;
  // ISO strings compare correctly as text.
  const duePassed = firstDue != null && firstDue < today;

  const lastPayment = useLastPayment(enteredDueDay, firstDue);

  const resetChoices = () => {
    setAdded(null);
    setCountThisCycle(true);
    setFirstMonth(presetMonth);
    setFirstAmount('');
    setFirstAmountError(null);
    lastPayment.clear();
  };

  const close = () => {
    onClose();
    reset(initial);
    resetChoices();
  };

  const addAnother = () => {
    reset(initial);
    resetChoices();
  };

  const onSubmit = async (values: CommitmentFormValues) => {
    if (!once && lastPayment.error) return;
    const amount = values.amountType === 'VARIABLE' ? firstAmount.trim() : '';
    if (amount && (!VALID_AMOUNT.test(amount) || Number(amount) <= 0)) {
      setFirstAmountError('Enter an amount like 1200 - or leave it blank');
      return;
    }
    setFirstAmountError(null);
    const startsFromNext = !once && duePassed && !countThisCycle;
    let created: CommitmentResponse;
    try {
      created = await createCommitment({
        name: values.name.trim(),
        amountType: values.amountType,
        fixedAmount: values.amountType === 'FIXED' ? (values.fixedAmount ?? null) : null,
        // "Just once" is a monthly rule whose window is that one salary month.
        frequency: values.frequency === 'ONCE' ? 'MONTHLY' : values.frequency,
        dueDay: Number(values.dueDay),
        accountId: values.accountId,
        categoryId: values.settleAs === 'TRANSFER' || values.settleAs === 'INVESTMENT' ? null : values.categoryId,
        mandatory: values.mandatory,
        settleAs: values.settleAs,
        toAccountId: values.toAccountId,
        ...(preset?.kind === 'GOAL' ? { sourceType: preset.sourceType, sourceId: preset.sourceId } : {}),
        ...(preset?.kind === 'GOAL_PAYMENT' ? { sourceType: 'GOAL' as const, sourceId: preset.sourceId } : {}),
        // The start of the chosen month, not today - "today" read as "this bill began
        // today", so a bill due on the 2nd added on the 12th owed nothing that month.
        // Today is only sent when the user says it genuinely starts from its next due date.
        activeFrom: startsFromNext ? today : (firstCycle?.start ?? today),
        activeTo: once ? (firstCycle?.end ?? firstDue) : lastPayment.lastDue,
        why: values.why?.trim() || null,
        ifSkipped: values.ifSkipped?.trim() || null,
      }).unwrap();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      setError('name', { message: appError.message ?? "Couldn't save that commitment." });
      return;
    }

    // The first occurrence only exists once the rule does (the server plans it), so its amount
    // is a second call - but still part of this one Save, not a step left for later.
    const firstOccurrence = startsFromNext ? firstDueOnOrAfter(today, Number(values.dueDay)) : firstDue;
    let firstAmountResult: AddedBill['firstAmount'] = null;
    if (amount && firstOccurrence) {
      try {
        const month = await resolveCycle(firstOccurrence).unwrap();
        const planned = await loadInstances(month.id).unwrap();
        const occurrence = planned.find((i) => i.commitmentId === created.id);
        if (occurrence) {
          await setInstanceAmount({ id: occurrence.id, expectedAmount: amount }).unwrap();
          firstAmountResult = { saved: true, amount };
        } else {
          firstAmountResult = { saved: false };
        }
      } catch {
        firstAmountResult = { saved: false };
      }
    }

    setAdded({
      id: created.id,
      name: created.name,
      dueDay: Number(values.dueDay),
      frequency: values.frequency === 'ONCE' ? 'MONTHLY' : values.frequency,
      mandatory: values.mandatory,
      income: values.settleAs === 'INCOME',
      once: values.frequency === 'ONCE',
      firstDue: firstOccurrence,
      startsLater,
      firstAmount: firstAmountResult,
    });
  };

  const inThisCycle = added ? instances?.find((i) => i.commitmentId === added.id) : undefined;

  return (
    <Modal
      open={open}
      onClose={close}
      title={
        added
          ? added.income
            ? 'Income added'
            : 'Commitment added'
          : preset?.kind === 'GOAL_PAYMENT'
            ? `A payment for ${preset.goalName}`
            : once
              ? 'Plan a one-off'
              : isIncome
                ? 'Add expected income'
                : 'Add a commitment'
      }
      footer={
        added ? (
          <div className="flex w-full gap-space-3">
            <Button variant="secondary" onClick={addAnother} className="flex-1">
              Add another
            </Button>
            <Button variant="primary" onClick={close} className="flex-1">
              Done
            </Button>
          </div>
        ) : (
          <Button type="submit" form="add-commitment" variant="primary" disabled={isLoading} className="w-full">
            Save
          </Button>
        )
      }
    >
      {added ? (
        <div className="flex items-start gap-space-3">
          <CheckCircle2 size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-positive" aria-hidden />
          <div className="flex flex-col gap-space-2">
            <p className="text-body text-ink">
              <strong className="font-medium">{added.name}</strong> is saved.
            </p>
            {added.once && added.startsLater && added.firstDue ? (
              <p className="text-body text-ink-soft">
                It happens once, on {formatDayMonthYear(added.firstDue)}. It shows in that month’s plan on Months and
                counts there.
              </p>
            ) : added.startsLater && added.firstDue ? (
              <p className="text-body text-ink-soft">
                Its first payment is on {formatDayMonthYear(added.firstDue)}. On Months, use the arrow beside the month
                name to move ahead and see it in that month’s plan.
              </p>
            ) : checkingPlan || !instances ? (
              <p className="text-body text-ink-soft">Checking this cycle’s plan…</p>
            ) : added.income && inThisCycle ? (
              <p className="text-body text-ink-soft">
                {inThisCycle.status === 'PAID'
                  ? `It matched income already in your Ledger (${formatShortDate(inThisCycle.dueDate)}), so this month counts what arrived.`
                  : `It’s expected ${formatShortDate(inThisCycle.dueDate)}. This month’s standing counts it until it arrives - recording the credit marks it received, and what arrived replaces the estimate. It’s never counted as money you can spend before then.`}
              </p>
            ) : inThisCycle &&
              (inThisCycle.status === 'PAID' || inThisCycle.status === 'SETTLED_EARLIER' || inThisCycle.status === 'UNVERIFIED') ? (
              <p className="text-body text-ink-soft">
                It was due {formatShortDate(inThisCycle.dueDate)}, and it matched a payment already in your Ledger — so
                it’s listed as settled and nothing is counted twice.
              </p>
            ) : inThisCycle && inThisCycle.dueDate < today ? (
              <p className="text-body text-ink-soft">
                It was due {formatShortDate(inThisCycle.dueDate)} and is in this cycle’s plan under “Due date passed”. If
                you’ve already paid it, settle it — or link the entry if it’s in your Ledger — so it stops counting as owed.
              </p>
            ) : inThisCycle ? (
              <p className="text-body text-ink-soft">
                It’s due {formatShortDate(inThisCycle.dueDate)} and is now in this cycle’s plan
                {added.mandatory ? ', and counted in what’s free until salary.' : '.'}
              </p>
            ) : added.frequency === 'MONTHLY' ? (
              <p className="text-body text-ink-soft">
                Its due date this cycle has already passed, so nothing is owed yet. It first appears in the plan on{' '}
                {formatShortDate(nextMonthlyDueDate(added.dueDay))}.
              </p>
            ) : (
              <p className="text-body text-ink-soft">
                It isn’t due in this cycle, so it isn’t in the plan yet. It appears when it next falls due.
              </p>
            )}
            {added.firstAmount?.saved === true && (
              <p className="text-body text-ink-soft">
                First amount saved: <span className="num">{formatMoney(added.firstAmount.amount)}</span>. Later ones start as
                “amount unknown” - give each one on Months with Estimate when you know it.
              </p>
            )}
            {added.firstAmount?.saved === false && (
              <p className="text-body text-attention">
                The commitment is saved, but its first amount couldn’t be - give it on Months with Estimate.
              </p>
            )}
          </div>
        </div>
      ) : (
        <form id="add-commitment" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-6">
          <CommitmentFields
            form={form}
            accounts={accounts}
            categories={categories}
            lastPayment={lastPayment}
            autoFocus
            allowOnce
            lockedSettlement={
              preset?.kind === 'TRANSFER' ? (
                <span className="text-label text-ink">Moved · into {preset.toLabel}</span>
              ) : preset?.kind === 'GOAL' ? (
                <span className="flex flex-col gap-space-1">
                  <span className="text-label text-ink">
                    Moved to my own account · into {accounts.find((acc) => acc.id === preset.toAccountId)?.name ?? 'the goal’s account'}
                  </span>
                  <span className="text-caption text-ink-muted">For your {preset.goalName} goal.</span>
                </span>
              ) : preset?.kind === 'GOAL_PAYMENT' ? (
                <span className="flex flex-col gap-space-1">
                  <span className="text-label text-ink">Payment · for your {preset.goalName} goal</span>
                  <span className="text-caption text-ink-muted">
                    Money leaving for it on this date - a booking, a deposit, the trip itself. It shows on Months in that
                    month, and the goal counts it once it’s paid.
                  </span>
                </span>
              ) : undefined
            }
            startSlot={
              cycle && (
                <FormRow
                  label={once ? 'When' : isIncome ? 'First one' : 'First payment'}
                  hint={
                    once
                      ? 'The month it happens - the exact date is shown beside it.'
                      : 'The month of the first one - the exact date is shown beside it. Pick an earlier month if it has already been running for a while.'
                  }
                >
                  <PaymentMonthPicker
                    value={pickerMonth}
                    onChange={setFirstMonth}
                    dueDay={enteredDueDay}
                    ariaLabel={once ? 'Which month it happens' : 'Month of the first payment'}
                  />
                </FormRow>
              )
            }
            amountSlot={
              <FormRow
                label="First amount"
                error={firstAmountError ?? undefined}
                hint="Optional. If you already know what the first one comes to, enter it. Each later one starts as “amount unknown” until you give it a number on Months."
              >
                <span className="flex items-center gap-space-1">
                  <span className="num text-ink-muted">₹</span>
                  <input
                    value={firstAmount}
                    onChange={(e) => setFirstAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="Optional - leave blank if not known yet"
                    className={FORM_ROW_CONTROL + ' num'}
                  />
                </span>
              </FormRow>
            }
            afterEndSlot={
              // Only asked when it matters: the start month's due date has already gone by.
              duePassed &&
              firstDue && (
                <FormRow label={startIsCurrent ? 'This month' : 'That one'}>
                  <Select
                    variant="row"
                    className="-ml-space-1 max-w-full"
                    ariaLabel="Whether the start month's bill counts"
                    value={countThisCycle ? 'count' : 'next'}
                    options={[
                      { value: 'count', label: `Count it - it was due ${formatDayMonthYear(firstDue)}` },
                      { value: 'next', label: 'Skip it - start from the next one' },
                    ]}
                    onChange={(v) => setCountThisCycle(v === 'count')}
                  />
                  <span className="mt-space-1 block text-caption text-ink-muted">
                    {formatDayMonthYear(firstDue)} has already gone by. Keep “Count it” if that payment was real - even if
                    you’ve already paid it.
                  </span>
                </FormRow>
              )
            }
          />

          {isIncome ? (
            <p className="text-caption text-ink-muted">
              Your salary each month, for planning: Months sets it against your bills before it lands. Record the credit
              when it arrives and it replaces this figure.
            </p>
          ) : null}
        </form>
      )}
    </Modal>
  );
}
