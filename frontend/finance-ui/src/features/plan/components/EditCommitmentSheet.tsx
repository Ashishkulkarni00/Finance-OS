import { useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCategoriesQuery } from '@/services/categoryService';
import {
  useDeleteCommitmentRuleMutation,
  useGetCommitmentRuleQuery,
  useUpdateCommitmentRuleMutation,
} from '@/services/commitmentRuleService';
import { handleEnterAdvance } from '@/lib/formKeyboard';
import { useSetCommitmentInstanceAmountMutation } from '@/services/commitmentInstanceService';
import type { CommitmentResponse, UpdateCommitmentRequest } from '@/types/commitmentRule';
import { CommitmentFields } from './CommitmentFields';
import { cycleOptions } from './AddCommitmentSheet';
import { PaymentMonthPicker } from './PaymentMonthPicker';
import { firstDueOnOrAfter, formatDayMonthYear, formatShortDate, salaryMonthContaining, shiftIsoDays, shiftIsoMonths } from '@/lib/dates';
import { useGetCurrentCycleQuery } from '@/services/cycleService';
import { commitmentSchema, isOneOff, MONTH_NAMES, useLastPayment, type CommitmentFormValues } from './commitmentForm';
import {
  GoalSettlement,
  LockedTerms,
  parseSourceKey,
  sourceKey,
  sourceOptions,
  suggestSource,
  useBillSources,
  type SourceKey,
} from './billSources';

interface EditCommitmentSheetProps {
  /** The bill (rule) to edit. Null keeps the sheet closed. */
  commitmentId: number | null;
  onClose: () => void;
  /** After a delete - e.g. leave a detail page that no longer has a bill behind it. */
  onDeleted?: () => void;
  /** The occurrence being viewed, if any - lets a "Varies" bill's current month be given
   *  its own amount without leaving Edit, instead of only via Months' inline "Estimate". */
  instanceId?: number | null;
  /** That occurrence's expected amount, if it already has one - prefills the field below
   *  so editing doesn't blank out a number that was already set. */
  instanceAmount?: string | null;
  /** That occurrence's due date - names which one "This time" is. */
  instanceDueDate?: string | null;
}

/**
 * "Edit" - every field of a commitment, and delete.
 *
 * <p>An edit applies to every month that isn't paid yet, this one and any already planned
 * ahead; paid months keep what was recorded. That's done server-side, so this sheet only
 * sends the rule's new values.
 */
export function EditCommitmentSheet({ commitmentId, onClose, onDeleted, instanceId, instanceAmount, instanceDueDate }: EditCommitmentSheetProps) {
  const { data: rule, isLoading } = useGetCommitmentRuleQuery(commitmentId ?? 0, { skip: commitmentId == null });

  return (
    <Modal open={commitmentId != null} onClose={onClose} title={rule ? `Edit ${rule.name}` : 'Edit commitment'} footer={null}>
      {isLoading || !rule ? (
        <div className="flex flex-col gap-space-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        // Keyed on the rule so each opening starts from its saved values.
        <EditForm
          key={`${rule.id}-${rule.updatedAt}`}
          rule={rule}
          onClose={onClose}
          onDeleted={onDeleted}
          instanceId={instanceId ?? null}
          instanceAmount={instanceAmount ?? null}
          instanceDueDate={instanceDueDate ?? null}
        />
      )}
    </Modal>
  );
}

/** What each form field is called on screen - for naming the one that stopped a save. */
const FIELD_LABELS: Partial<Record<keyof CommitmentFormValues, string>> = {
  name: 'What',
  amountType: 'Same every time?',
  fixedAmount: 'How much',
  frequency: 'How often',
  dueDay: 'Due on',
  accountId: 'Paid from',
  settleAs: 'Type',
  toAccountId: 'Into',
  categoryId: 'Category',
  mandatory: 'Must pay?',
  why: 'Note',
};

/** Same format `InstanceAmountForm` validates against - one amount, up to 2 decimal places. */
const VALID_INSTANCE_AMOUNT = /^\d+(\.\d{1,2})?$/;

/**
 * The edit form. "Linked to" ties the commitment to what it pays - a loan's EMI, a holding's
 * instalment, a goal's monthly transfer - so those figures are entered once, on the loan or
 * holding, and the bill keeps up. A hand-typed bill that looks like one of them gets a
 * one-click suggestion; nothing is linked without the user choosing it.
 */
function EditForm({
  rule,
  onClose,
  onDeleted,
  instanceId,
  instanceAmount,
  instanceDueDate,
}: {
  rule: CommitmentResponse;
  onClose: () => void;
  onDeleted?: () => void;
  instanceId: number | null;
  instanceAmount: string | null;
  instanceDueDate: string | null;
}) {
  const { data: accountsPage } = useGetAccountsQuery();
  const { data: categoriesPage } = useGetCategoriesQuery();
  const [updateRule, { isLoading: saving }] = useUpdateCommitmentRuleMutation();
  const [deleteRule, { isLoading: deleting }] = useDeleteCommitmentRuleMutation();
  const [setInstanceAmount, { isLoading: savingAmount }] = useSetCommitmentInstanceAmountMutation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Shown right above Save, in addition to any field-level error - so a rejected save is
  // never silent just because its field isn't the one currently in view.
  const [formError, setFormError] = useState<string | null>(null);
  // A plain field, not react-hook-form/zod: it belongs to the occurrence, not the rule, and
  // is saved with a separate call inside the same Save action rather than a schema field
  // that would apply to every month. '' means "leave it as it is" (see onSubmit).
  const [instanceAmountInput, setInstanceAmountInput] = useState(instanceAmount ?? '');
  const [followKey, setFollowKey] = useState<SourceKey | null>(sourceKey(rule.sourceType, rule.sourceId));
  const sources = useBillSources(rule.id);
  const oneOff = isOneOff(rule);
  const { data: cycle } = useGetCurrentCycleQuery();
  /** '' = this month and every unpaid month (the default); else a later cycle's start. */
  const [applyFrom, setApplyFrom] = useState('');
  const [reason, setReason] = useState('');
  /** The calendar month (`YYYY-MM`) of the first payment - or of a one-off's only one; '' keeps it. */
  const [firstMonth, setFirstMonth] = useState('');
  const savedFirstMonth = firstDueOnOrAfter(rule.activeFrom, rule.dueDay).slice(0, 7);
  // Turning a repeating bill into a one-off keeps only the month it starts in.
  const startCycleEnd = shiftIsoDays(shiftIsoMonths(rule.activeFrom, 1), -1);
  // Only dates after the commitment's own start (and before its end) - a "from" on or before
  // its start changes it throughout, which is just "Now" under another name.
  const laterMonths = cycle
    ? cycleOptions(cycle.startDate).filter(
        (o) => o.start > cycle.startDate && o.start > rule.activeFrom && (!rule.activeTo || o.start <= rule.activeTo),
      )
    : [];

  const accounts = accountsPage?.content.filter((a) => !a.archived || a.id === rule.account.id || a.id === rule.toAccountId) ?? [];
  const categories = categoriesPage?.content.filter((c) => !c.archived || c.id === rule.category?.id) ?? [];

  const form = useForm<CommitmentFormValues>({
    resolver: zodResolver(commitmentSchema),
    defaultValues: {
      name: rule.name,
      amountType: rule.amountType,
      fixedAmount: rule.fixedAmount ?? '',
      frequency: oneOff ? 'ONCE' : rule.frequency,
      dueDay: String(rule.dueDay),
      accountId: rule.account.id,
      settleAs: rule.settleAs,
      // The API omits a null field, so a payment's or income's missing "Into" arrives as
      // undefined - which the schema rejects, on a row that isn't even shown. Normalise it.
      toAccountId: rule.toAccountId ?? null,
      categoryId: rule.category?.id ?? null,
      mandatory: rule.mandatory,
      why: rule.why ?? '',
    },
  });
  const { handleSubmit, watch, setError, setValue } = form;
  const settleAs = watch('settleAs');

  const lastPayment = useLastPayment(Number(watch('dueDay')), rule.activeFrom, rule.activeTo);

  const follow = parseSourceKey(followKey);
  const loan = follow?.type === 'LOAN' ? sources.loans.find((l) => l.id === follow.id) : undefined;
  const investment = follow?.type === 'INVESTMENT' ? sources.investments.find((i) => i.id === follow.id) : undefined;
  const goal = follow?.type === 'GOAL' ? sources.goals.find((g) => g.id === follow.id) : undefined;
  const termsLocked = !!loan || !!investment;
  const suggestion =
    rule.sourceType === 'MANUAL' && followKey == null
      ? suggestSource(
          { name: rule.name, amountType: rule.amountType, fixedAmount: rule.fixedAmount, toAccountId: rule.toAccountId ?? null, accountId: rule.account.id },
          sources,
        )
      : null;
  const options = sourceOptions(sources);

  const chooseFollow = (key: SourceKey | null) => {
    setFollowKey(key);
    // A Payment linked to a goal is money the goal pays out (a trip's booking) and stays a
    // payment. Anything else linked to a goal funds it: a transfer into its account.
    const next = parseSourceKey(key);
    const nextGoal = next?.type === 'GOAL' ? sources.goals.find((g) => g.id === next.id) : undefined;
    if (nextGoal && watch('settleAs') !== 'EXPENSE') {
      setValue('settleAs', 'TRANSFER', { shouldValidate: true });
      setValue('toAccountId', nextGoal.linkedAccountId ?? null, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: CommitmentFormValues) => {
    setFormError(null);
    // '' means "leave it as it is" - the endpoint has no way to unset an amount, only set
    // one, so an emptied field is never sent rather than treated as a validation failure.
    const trimmedInstanceAmount = instanceAmountInput.trim();
    const instanceAmountEligible = !termsLocked && values.amountType === 'VARIABLE' && instanceId != null;
    const instanceAmountChanged = instanceAmountEligible && trimmedInstanceAmount !== '' && trimmedInstanceAmount !== (instanceAmount ?? '');
    if (instanceAmountChanged && !VALID_INSTANCE_AMOUNT.test(trimmedInstanceAmount)) {
      setFormError('This occurrence’s amount looks wrong - enter something like 1200.');
      return;
    }
    const own = {
      name: values.name.trim(),
      ...(values.categoryId != null ? { categoryId: values.categoryId } : rule.category ? { clearCategory: true } : {}),
      mandatory: values.mandatory,
      // "" clears on the server.
      why: values.why?.trim() ?? '',
      // `ifSkipped` is deliberately NOT sent: the field is gone from the form, and
      // PATCH leaves an omitted field alone. Sending "" would wipe what's already
      // recorded on every save - removing a field from a form must not delete data.
      // Recorded on the plan revision, not on the bill - it explains this change, not the
      // bill's existence (that's "why"). Omitted when blank rather than sent as "",
      // because an absent reason is a fact worth keeping as absent. ADR-0015.
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    };
    const link = follow ? { sourceType: follow.type, sourceId: follow.id } : rule.sourceType !== 'MANUAL' ? { clearSource: true } : {};
    // The first payment is picked as a calendar month; the salary month it falls in is the rule's window.
    const pickedMonth = firstMonth && firstMonth !== savedFirstMonth ? firstMonth : '';
    const picked =
      pickedMonth && cycle ? salaryMonthContaining(cycle.startDate, `${pickedMonth}-${String(Number(values.dueDay)).padStart(2, '0')}`) : null;
    const newStart = picked && picked.start !== rule.activeFrom ? picked.start : '';

    let body: UpdateCommitmentRequest;
    if (termsLocked) {
      // Amount, day, account and how it's paid come from the loan or holding. A holding's
      // instalment can still be stopped - ending an RD or SIP is the user's call.
      if (investment && lastPayment.error) {
        setFormError(lastPayment.error);
        return;
      }
      body = {
        ...own,
        ...link,
        ...(investment
          ? lastPayment.lastDue
            ? { activeTo: lastPayment.lastDue }
            : rule.activeTo
              ? { clearActiveTo: true }
              : {}
          : {}),
      };
    } else {
      const once = values.frequency === 'ONCE';
      if (!once && lastPayment.error) {
        setFormError(lastPayment.error);
        return;
      }
      body = {
        ...own,
        ...link,
        amountType: values.amountType,
        ...(values.amountType === 'FIXED' && values.fixedAmount ? { fixedAmount: values.fixedAmount } : {}),
        // A one-off keeps its one-month window; only a repeating bill's end is edited here.
        frequency: values.frequency === 'ONCE' ? 'MONTHLY' : values.frequency,
        dueDay: Number(values.dueDay),
        accountId: values.accountId,
        ...(once
          ? picked
            ? { activeFrom: picked.start, activeTo: picked.end }
            : oneOff
              ? {}
              : { activeTo: startCycleEnd }
          : lastPayment.lastDue ? { activeTo: lastPayment.lastDue } : rule.activeTo ? { clearActiveTo: true } : {}),
        settleAs: values.settleAs,
        ...(values.toAccountId != null ? { toAccountId: values.toAccountId } : {}),
        // Moving the start re-plans the unpaid months around it; the server retires or restores them.
        ...(!once && newStart ? { activeFrom: newStart } : {}),
        ...(applyFrom && !newStart ? { applyFrom } : {}),
      };
    }
    try {
      await updateRule({ id: rule.id, body }).unwrap();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      const message = appError.message ?? "Couldn't save the changes.";
      // Field-specific, for the row it's next to - but a field far from where the user is
      // scrolled to is easy to miss, so the same message always shows as a banner too.
      if (appError.field === 'fixedAmount' || appError.field === 'dueDay' || appError.field === 'toAccountId') {
        setError(appError.field, { message });
      }
      setFormError(message);
      return;
    }
    // One Save does both: the bill's own fields, and (if it changed) this occurrence's
    // amount - no second button needed for what reads as one action to the user.
    if (instanceAmountChanged) {
      try {
        await setInstanceAmount({ id: instanceId!, expectedAmount: trimmedInstanceAmount }).unwrap();
      } catch (err) {
        const appError = err as { message?: string };
        // The bill itself already saved - say so, rather than let a second failure read as
        // if nothing happened.
        setFormError(`The bill saved, but this occurrence's amount didn't: ${appError.message ?? "couldn't save it"}.`);
        return;
      }
    }
    onClose();
  };

  // A rule the form checks but has no row to show it on (or a row scrolled out of view)
  // must never make Save look dead - name the field and say what's wrong, above Save.
  const onInvalid = (errs: FieldErrors<CommitmentFormValues>) => {
    const first = Object.entries(errs)[0];
    if (!first) return;
    const [field, error] = first;
    setFormError(`${FIELD_LABELS[field as keyof CommitmentFormValues] ?? field}: ${error?.message ?? 'this needs a look'}`);
  };

  const onDelete = async () => {
    try {
      await deleteRule(rule.id).unwrap();
      onClose();
      onDeleted?.();
    } catch (err) {
      setDeleteError((err as { message?: string }).message ?? "Couldn't delete this bill.");
    }
  };

  return (
    <form id="edit-commitment" onSubmit={handleSubmit(onSubmit, onInvalid)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-6">
      <CommitmentFields
        form={form}
        accounts={accounts}
        categories={categories}
        lastPayment={lastPayment}
        autoFocus
        allowOnce
        startSlot={
          !termsLocked && cycle ? (
            <FormRow
              label={watch('frequency') === 'ONCE' ? 'When' : settleAs === 'INCOME' ? 'First one' : 'First payment'}
              hint={
                watch('frequency') === 'ONCE'
                  ? 'The month it happens - the exact date is shown beside it.'
                  : 'Moving it later drops the unpaid months before it. Paid ones stay.'
              }
            >
              <PaymentMonthPicker
                value={firstMonth || savedFirstMonth}
                onChange={setFirstMonth}
                dueDay={Number(watch('dueDay'))}
                ariaLabel={watch('frequency') === 'ONCE' ? 'Which month it happens' : 'Month of the first payment'}
              />
            </FormRow>
          ) : undefined
        }
        amountSlot={
          instanceId != null && !termsLocked ? (
            <FormRow
              label="This time"
              hint={`This month only - the one due ${instanceDueDate ? formatShortDate(instanceDueDate) : 'now'}. Later months you fill in as you go.`}
            >
              <span className="flex items-center gap-space-1">
                <span className="num text-ink-muted">₹</span>
                <input
                  inputMode="decimal"
                  value={instanceAmountInput}
                  onChange={(e) => setInstanceAmountInput(e.target.value)}
                  placeholder={instanceDueDate ? `Amount due ${formatShortDate(instanceDueDate)} - optional` : 'Optional'}
                  aria-label={`Amount for ${rule.name} this time`}
                  className={FORM_ROW_CONTROL + ' num'}
                />
              </span>
            </FormRow>
          ) : undefined
        }
        lockedTerms={termsLocked ? <LockedTerms loan={loan} investment={investment} /> : undefined}
        lockedSettlement={goal && settleAs !== 'EXPENSE' ? <GoalSettlement goal={goal} accounts={accounts} /> : undefined}
      />

      {investment && (
        <div className="rounded-lg border border-line">
          <FormRow label="Last instalment" error={lastPayment.error ?? undefined} hint="The month of its final instalment.">
            <span className="flex flex-wrap items-center gap-space-2">
              <Select
                variant="row"
                className="-ml-space-1"
                ariaLabel="Month of the last instalment"
                value={lastPayment.endMonth}
                placeholder="Keeps going"
                clearable
                options={MONTH_NAMES.map((name, i) => ({ value: String(i + 1).padStart(2, '0'), label: name }))}
                onChange={lastPayment.setEndMonth}
              />
              <Select
                variant="row"
                ariaLabel="Year of the last instalment"
                value={lastPayment.endYear}
                placeholder="Year"
                clearable
                options={lastPayment.yearOptions}
                onChange={lastPayment.setEndYear}
              />
            </span>
          </FormRow>
        </div>
      )}

      {(followKey != null || (settleAs !== 'INCOME' && options.length > 0)) && (
        <div className="flex flex-col gap-space-2">
          <div className="rounded-lg border border-line">
            <FormRow
              label="Linked to"
              hint="Ties this to a loan, SIP, RD or goal, so its amount and dates come from there."
            >
              <Select
                variant="row"
                className="-ml-space-1 max-w-full"
                ariaLabel="Loan, investment or goal this is linked to"
                value={followKey ?? ''}
                placeholder="Not linked - I enter the amount"
                clearable
                options={options}
                onChange={(v) => chooseFollow((v || null) as SourceKey | null)}
              />
            </FormRow>
          </div>
          {suggestion && (
            <p className="text-caption text-ink-soft">
              This looks like {suggestion.label}.{' '}
              <button type="button" className="text-accent underline-offset-2 hover:underline" onClick={() => chooseFollow(suggestion.key)}>
                Link it
              </button>{' '}
              so the two stay in step.
            </p>
          )}
        </div>
      )}

      {!termsLocked && !oneOff && watch('frequency') !== 'ONCE' && (rule.sourceType === 'MANUAL' || rule.sourceType === 'GOAL') && laterMonths.length > 0 && (
        <div className="rounded-lg border border-line">
          <FormRow
            label="Changes start"
            hint="For a change that starts later, like rent rising from January. Earlier months keep the old figures."
          >
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="When these changes start"
              value={applyFrom}
              options={[
                { value: '', label: 'Now - this one and every one after' },
                ...laterMonths.map((o) => ({ value: o.start, label: `Payments from ${formatDayMonthYear(o.start)}` })),
              ]}
              onChange={(v) => setApplyFrom(v ?? '')}
            />
          </FormRow>
        </div>
      )}

      {/* Asked at the point of the decision, where the answer is known - a week later
          nobody remembers. Optional on purpose: a required "why?" gets answered with "."  */}
      <div className="rounded-lg border border-line">
        <FormRow
          label="Why the change"
          hint="Optional. So next year you know why."
        >
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={255}
            autoComplete="off"
            placeholder="Optional"
            className={FORM_ROW_CONTROL}
          />
        </FormRow>
      </div>

      <p className="text-caption text-ink-muted">
        {applyFrom
          ? `Payments before ${formatDayMonthYear(applyFrom)} keep the old figures; from then on it uses these. To stop it instead, set its last payment.`
          : 'Saving updates every one not yet paid - this month’s and later ones. Paid ones keep what was recorded.'}
      </p>

      {formError && <p className="text-caption text-critical">{formError}</p>}

      {confirmingDelete ? (
        <div className="flex flex-col gap-space-3 rounded-lg border border-line p-space-4">
          <p className="text-body text-ink">Delete {rule.name}?</p>
          <p className="text-caption text-ink-muted">
            It stops appearing in future months, and this month’s unpaid one is removed. Paid ones stay in your history. To
            stop it after a final payment instead, set “Last payment”.
          </p>
          {deleteError && <p className="text-caption text-critical">{deleteError}</p>}
          <div className="flex gap-space-3">
            <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)} className="flex-1">
              Keep it
            </Button>
            <Button type="button" variant="primary" onClick={onDelete} disabled={deleting} className="flex-1 !bg-critical">
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-space-3">
          <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(true)}>
            Delete
          </Button>
          <Button type="submit" variant="primary" disabled={saving || savingAmount} className="flex-1">
            Save changes
          </Button>
        </div>
      )}
    </form>
  );
}
