import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { Select } from '@/components/Select';
import { FormRow } from '@/components/FormRow';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCategoriesQuery } from '@/services/categoryService';
import {
  useDeleteCommitmentRuleMutation,
  useGetCommitmentRuleQuery,
  useUpdateCommitmentRuleMutation,
} from '@/services/commitmentRuleService';
import { handleEnterAdvance } from '@/lib/formKeyboard';
import type { CommitmentResponse, UpdateCommitmentRequest } from '@/types/commitmentRule';
import { CommitmentFields } from './CommitmentFields';
import { cycleOptions } from './AddCommitmentSheet';
import { SalaryMonthPicker } from './SalaryMonthPicker';
import { cycleMonthName, shiftIsoDays, shiftIsoMonths } from '@/lib/dates';
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
}

/**
 * "Edit bill" - every field of a bill, and delete.
 *
 * <p>An edit applies to every month that isn't paid yet, this one and any already planned
 * ahead; paid months keep what was recorded. That's done server-side, so this sheet only
 * sends the rule's new values.
 */
export function EditCommitmentSheet({ commitmentId, onClose, onDeleted }: EditCommitmentSheetProps) {
  const { data: rule, isLoading } = useGetCommitmentRuleQuery(commitmentId ?? 0, { skip: commitmentId == null });

  return (
    <Modal open={commitmentId != null} onClose={onClose} title={rule ? `Edit ${rule.name}` : 'Edit bill'} footer={null}>
      {isLoading || !rule ? (
        <div className="flex flex-col gap-space-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        // Keyed on the rule so each opening starts from its saved values.
        <EditForm key={`${rule.id}-${rule.updatedAt}`} rule={rule} onClose={onClose} onDeleted={onDeleted} />
      )}
    </Modal>
  );
}

/**
 * The edit form. "Follows" links the bill to what it pays - a loan's EMI, a holding's
 * instalment, a goal's monthly transfer - so those figures are entered once, on the loan or
 * holding, and the bill keeps up. A hand-typed bill that looks like one of them gets a
 * one-click suggestion; nothing is linked without the user choosing it.
 */
function EditForm({ rule, onClose, onDeleted }: { rule: CommitmentResponse; onClose: () => void; onDeleted?: () => void }) {
  const { data: accountsPage } = useGetAccountsQuery();
  const { data: categoriesPage } = useGetCategoriesQuery();
  const [updateRule, { isLoading: saving }] = useUpdateCommitmentRuleMutation();
  const [deleteRule, { isLoading: deleting }] = useDeleteCommitmentRuleMutation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [followKey, setFollowKey] = useState<SourceKey | null>(sourceKey(rule.sourceType, rule.sourceId));
  const sources = useBillSources(rule.id);
  const oneOff = isOneOff(rule);
  const { data: cycle } = useGetCurrentCycleQuery();
  /** '' = this month and every unpaid month (the default); else a later cycle's start. */
  const [applyFrom, setApplyFrom] = useState('');
  /** A one-off's month: '' keeps the one it's in. */
  const [onceIn, setOnceIn] = useState('');
  /** A repeating bill's new start: '' keeps it (FIX_BACKLOG 2.3). */
  const [startIn, setStartIn] = useState('');
  // Turning a repeating bill into a one-off keeps only the month it starts in.
  const startCycleEnd = shiftIsoDays(shiftIsoMonths(rule.activeFrom, 1), -1);
  const laterMonths = cycle ? cycleOptions(cycle.startDate).filter((o) => o.start > cycle.startDate) : [];

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
      toAccountId: rule.toAccountId,
      categoryId: rule.category?.id ?? null,
      mandatory: rule.mandatory,
      why: rule.why ?? '',
      ifSkipped: rule.ifSkipped ?? '',
    },
  });
  const { handleSubmit, watch, setError, setValue } = form;

  const lastPayment = useLastPayment(Number(watch('dueDay')), rule.activeFrom, rule.activeTo);

  const follow = parseSourceKey(followKey);
  const loan = follow?.type === 'LOAN' ? sources.loans.find((l) => l.id === follow.id) : undefined;
  const investment = follow?.type === 'INVESTMENT' ? sources.investments.find((i) => i.id === follow.id) : undefined;
  const goal = follow?.type === 'GOAL' ? sources.goals.find((g) => g.id === follow.id) : undefined;
  const termsLocked = !!loan || !!investment;
  const suggestion =
    rule.sourceType === 'MANUAL' && followKey == null
      ? suggestSource(
          { name: rule.name, amountType: rule.amountType, fixedAmount: rule.fixedAmount, toAccountId: rule.toAccountId, accountId: rule.account.id },
          sources,
        )
      : null;
  const options = sourceOptions(sources);

  const chooseFollow = (key: SourceKey | null) => {
    setFollowKey(key);
    // Funding a goal is a transfer into its account - set it so the form validates.
    const next = parseSourceKey(key);
    const nextGoal = next?.type === 'GOAL' ? sources.goals.find((g) => g.id === next.id) : undefined;
    if (nextGoal) {
      setValue('settleAs', 'TRANSFER', { shouldValidate: true });
      setValue('toAccountId', nextGoal.linkedAccountId, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: CommitmentFormValues) => {
    const own = {
      name: values.name.trim(),
      ...(values.categoryId != null ? { categoryId: values.categoryId } : rule.category ? { clearCategory: true } : {}),
      mandatory: values.mandatory,
      // "" clears on the server.
      why: values.why?.trim() ?? '',
      ifSkipped: values.ifSkipped?.trim() ?? '',
    };
    const link = follow ? { sourceType: follow.type, sourceId: follow.id } : rule.sourceType !== 'MANUAL' ? { clearSource: true } : {};

    let body: UpdateCommitmentRequest;
    if (termsLocked) {
      // Amount, day, account and how it's paid come from the loan or holding. A holding's
      // instalment can still be stopped - ending an RD or SIP is the user's call.
      if (investment && lastPayment.error) return;
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
      if (!once && lastPayment.error) return;
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
          ? onceIn
            ? { activeFrom: onceIn, activeTo: shiftIsoDays(shiftIsoMonths(onceIn, 1), -1) }
            : oneOff
              ? {}
              : { activeTo: startCycleEnd }
          : lastPayment.lastDue ? { activeTo: lastPayment.lastDue } : rule.activeTo ? { clearActiveTo: true } : {}),
        settleAs: values.settleAs,
        ...(values.toAccountId != null ? { toAccountId: values.toAccountId } : {}),
        // Moving the start re-plans the unpaid months around it; the server retires or restores them.
        ...(!once && startIn ? { activeFrom: startIn } : {}),
        ...(applyFrom && !startIn ? { applyFrom } : {}),
      };
    }
    try {
      await updateRule({ id: rule.id, body }).unwrap();
      onClose();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      const field = appError.field === 'fixedAmount' || appError.field === 'dueDay' || appError.field === 'toAccountId' ? appError.field : 'name';
      setError(field, { message: appError.message ?? "Couldn't save the changes." });
    }
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
    <form id="edit-commitment" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-6">
      {options.length > 0 && (
        <div className="flex flex-col gap-space-2">
          <div className="rounded-lg border border-line">
            <FormRow label="Follows" hint="Link the loan, investment or goal this bill pays, and its figures come from there.">
              <Select
                variant="row"
                className="-ml-space-1 max-w-full"
                ariaLabel="What this bill pays"
                value={followKey ?? ''}
                placeholder="Nothing - I set the figures"
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

      <CommitmentFields
        form={form}
        accounts={accounts}
        categories={categories}
        lastPayment={lastPayment}
        autoFocus
        allowOnce
        startSlot={
          !termsLocked && cycle ? (
            watch('frequency') === 'ONCE' ? (
              <FormRow label="In" hint="The salary month this one-off belongs to.">
                <SalaryMonthPicker
                  value={onceIn || rule.activeFrom}
                  knownStart={cycle.startDate}
                  onChange={(v) => setOnceIn(v === rule.activeFrom ? '' : v)}
                  ariaLabel="Which month this one-off is in"
                />
              </FormRow>
            ) : (
              <FormRow label="Starts" hint="The salary month of its first payment. Months before it drop out of the plan unless already paid.">
                <SalaryMonthPicker
                  value={startIn || rule.activeFrom}
                  knownStart={cycle.startDate}
                  onChange={(v) => setStartIn(v === rule.activeFrom ? '' : v)}
                  ariaLabel="Which month this starts in"
                />
              </FormRow>
            )
          ) : undefined
        }
        lockedTerms={termsLocked ? <LockedTerms loan={loan} investment={investment} /> : undefined}
        lockedSettlement={goal ? <GoalSettlement goal={goal} accounts={accounts} /> : undefined}
      />

      {!termsLocked && watch('frequency') === 'ONCE' && (
        <p className="text-caption text-ink-soft">
          Just once: only in {cycleMonthName(shiftIsoDays(shiftIsoMonths(onceIn || rule.activeFrom, 1), -1))}, on the{' '}
          {watch('dueDay') || '…'}th - it won’t come back in later months.
        </p>
      )}

      {investment && (
        <div className="rounded-lg border border-line">
          <FormRow label="Last instalment" error={lastPayment.error ?? undefined} hint="Stopping this SIP or RD? Pick the month of its final instalment.">
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

      {!termsLocked && !oneOff && watch('frequency') !== 'ONCE' && (rule.sourceType === 'MANUAL' || rule.sourceType === 'GOAL') && laterMonths.length > 0 && (
        <div className="rounded-lg border border-line">
          <FormRow label="Apply from" hint="A change that starts later - earlier months keep the bill as it is now.">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="When these changes start"
              value={applyFrom}
              options={[
                { value: '', label: 'This month and every month after it' },
                ...laterMonths.map((o) => ({ value: o.start, label: `From ${o.label}` })),
              ]}
              onChange={(v) => setApplyFrom(v ?? '')}
            />
          </FormRow>
        </div>
      )}

      <p className="text-caption text-ink-muted">
        {applyFrom
          ? 'Months before then keep the bill exactly as it is now; from then on it uses these figures. To stop it instead, set its last payment.'
          : 'Changes apply to this month and every month after it that isn’t paid yet. Months already paid keep what was recorded.'}
      </p>

      {confirmingDelete ? (
        <div className="flex flex-col gap-space-3 rounded-lg border border-line p-space-4">
          <p className="text-body text-ink">Delete {rule.name}?</p>
          <p className="text-caption text-ink-muted">
            It stops appearing in future months, and this month’s unpaid one is removed. Months already paid stay in your
            history. To end it after a final payment instead, set “Last payment”.
          </p>
          {deleteError && <p className="text-caption text-critical">{deleteError}</p>}
          <div className="flex gap-space-3">
            <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)} className="flex-1">
              Keep it
            </Button>
            <Button type="button" variant="primary" onClick={onDelete} disabled={deleting} className="flex-1 !bg-critical">
              Delete bill
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-space-3">
          <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(true)}>
            Delete
          </Button>
          <Button type="submit" variant="primary" disabled={saving} className="flex-1">
            Save changes
          </Button>
        </div>
      )}
    </form>
  );
}
