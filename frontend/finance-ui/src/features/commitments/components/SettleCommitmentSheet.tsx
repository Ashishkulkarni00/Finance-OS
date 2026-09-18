import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { FormRow } from '@/components/FormRow';
import { Amount } from '@/components/Amount';
import { AmountInput } from '@/features/transactions/components/AmountInput';
import { CategorySelect } from '@/features/transactions/components/CategorySelect';
import { todayIso } from '@/features/transactions/components/transactionForm';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeSettleSheet } from '@/store/slices/uiSlice';
import { useGetCommitmentInstanceDetailQuery, useSettleCommitmentInstanceMutation } from '@/services/commitmentInstanceService';
import { useCreateTransactionMutation, useGetTransactionsQuery } from '@/services/transactionService';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCategoriesQuery } from '@/services/categoryService';
import { formatShortDate } from '@/lib/dates';
import { handleEnterAdvance } from '@/lib/formKeyboard';
import { cn } from '@/lib/cn';

const schema = z.object({
  amount: z
    .string()
    .min(1, 'Enter an amount')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount')
    .refine((v) => Number(v) > 0, 'Amount must be more than zero'),
  accountId: z.number({ error: 'Choose an account' }),
  // Required for an expense or income only - checked on submit, where the kind is known.
  categoryId: z.number().optional(),
  date: z.string().min(1),
  note: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;
type Mode = 'new' | 'link';

/** How far either side of the due date to look for an existing payment - wider than the
 *  server's 3-day auto-match, because here a person is choosing, not a heuristic. */
const LINK_WINDOW_DAYS = 15;

/** How each kind of bill is talked about in this sheet. */
const KIND_COPY = {
  EXPENSE: { record: 'Record a new payment', entries: 'Expenses', button: 'Record payment' },
  TRANSFER: { record: 'Record the transfer', entries: 'Transfers', button: 'Record transfer' },
  INVESTMENT: { record: 'Record the investment', entries: 'Investments', button: 'Record investment' },
  INCOME: { record: 'Record what arrived', entries: 'Income entries', button: 'Record income' },
} as const;

/** `YYYY-MM-DD` shifted by whole days - date arithmetic, allowed client-side. */
function shiftIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * "Settle" from anywhere in the product - Today, Month, Month Close, and the instance's
 * own detail page all open this same sheet.
 *
 * <p>Two ways to settle, because there are two real situations:
 * <ul>
 *   <li><strong>Record a new payment</strong> - creates the expense, then links it.</li>
 *   <li><strong>Link an entry already in the Ledger</strong> - for a bill that was paid
 *       and recorded before the bill itself was added. Previously the only option was to
 *       record a new payment, which put the same money in the Ledger twice (rule 4). The
 *       server's own auto-match catches the clear cases when the occurrence is generated;
 *       this is the manual path for the rest. The server refuses an entry that already
 *       pays another bill.</li>
 * </ul>
 */
export function SettleCommitmentSheet() {
  const dispatch = useAppDispatch();
  const instanceId = useAppSelector((s) => s.ui.settlingInstanceId);
  const open = instanceId != null;

  const [mode, setMode] = useState<Mode>('new');
  const [selectedTxId, setSelectedTxId] = useState<number | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: instance } = useGetCommitmentInstanceDetailQuery(instanceId ?? 0, { skip: !instanceId });
  const { data: accountsPage } = useGetAccountsQuery();
  const { data: categoriesPage } = useGetCategoriesQuery();
  const [createTransaction] = useCreateTransactionMutation();
  const [settleInstance] = useSettleCommitmentInstanceMutation();

  const today = todayIso();
  const dateFrom = instance ? shiftIso(instance.dueDate, -LINK_WINDOW_DAYS) : undefined;
  const windowEnd = instance ? shiftIso(instance.dueDate, LINK_WINDOW_DAYS) : undefined;
  const dateTo = windowEnd && windowEnd > today ? today : windowEnd;
  // The entry that pays a bill is the kind the bill says: an expense, a transfer to your
  // own account, an investment, or (for expected income) income.
  const kind = instance?.settleAs ?? 'EXPENSE';
  const copy = KIND_COPY[kind];
  const { data: candidatesPage, isFetching: loadingCandidates } = useGetTransactionsQuery(
    { accountId: instance?.account.id, type: kind, dateFrom, dateTo, size: 20 },
    { skip: !instance || mode !== 'link' },
  );
  // A transfer or investment must also go where the bill says.
  const candidates = (candidatesPage?.content ?? []).filter(
    (t) => instance?.toAccountId == null || t.toAccount?.id === instance.toAccountId,
  );

  // Only an expense can come off a card; transfers, investments and income use bank or cash.
  const accounts =
    accountsPage?.content.filter((a) => !a.archived && (kind === 'EXPENSE' || a.type === 'BANK' || a.type === 'CASH')) ?? [];
  const toAccount = accountsPage?.content.find((a) => a.id === instance?.toAccountId);
  const needsCategory = kind === 'EXPENSE' || kind === 'INCOME';
  const categories =
    categoriesPage?.content.filter((c) => !c.archived && (kind === 'INCOME' ? c.group === 'INCOME' : c.group !== 'INCOME')) ?? [];
  const duePassed = instance ? instance.dueDate < today : false;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', accountId: undefined, categoryId: undefined, date: today, note: '' },
  });

  // Re-seed once the instance's own detail arrives - amount defaults to what's still
  // owed, account and category to the commitment's own, so the common case is "confirm".
  useEffect(() => {
    if (instance) {
      reset({
        amount: instance.outstanding ?? instance.expectedAmount ?? '',
        accountId: instance.account.id,
        categoryId: instance.category?.id,
        date: today,
        note: '',
      });
      setMode('new');
      setSelectedTxId(null);
      setLinkError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance?.id]);

  const close = () => {
    dispatch(closeSettleSheet());
    reset();
    setMode('new');
    setSelectedTxId(null);
    setLinkError(null);
  };

  const onRecordNew = async (values: FormValues) => {
    if (!instance) return;
    if (needsCategory && values.categoryId == null) {
      setError('categoryId', { message: 'Choose a category' });
      return;
    }
    setIsSaving(true);
    try {
      const created = await createTransaction({
        date: values.date,
        description: instance.commitmentName,
        type: kind,
        amount: values.amount,
        accountId: values.accountId,
        toAccountId: kind === 'TRANSFER' || kind === 'INVESTMENT' ? instance.toAccountId : null,
        categoryId: needsCategory ? values.categoryId : null,
        note: values.note?.trim() || null,
      }).unwrap();

      await settleInstance({ id: instance.id, transactionId: created.id, amount: values.amount }).unwrap();
      close();
    } catch (err) {
      // The expense may have posted even if the link failed - never silently drop
      // that fact. The transaction itself is always visible in the Ledger either way.
      const appError = err as { message?: string; field?: string };
      setError('amount', {
        message: appError.message ?? "Recorded, but couldn't link it to this commitment. Check the Ledger.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onLinkExisting = async () => {
    const chosen = candidates.find((t) => t.id === selectedTxId);
    if (!instance || !chosen) return;
    setIsSaving(true);
    setLinkError(null);
    try {
      await settleInstance({ id: instance.id, transactionId: chosen.id, amount: chosen.amount }).unwrap();
      close();
    } catch (err) {
      setLinkError((err as { message?: string }).message ?? "Couldn't link that entry. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={close}
      title={instance ? `Settle ${instance.commitmentName}` : 'Settle'}
      footer={
        instance &&
        (mode === 'new' ? (
          <Button type="submit" form="settle-commitment" variant="primary" disabled={isSaving} className="w-full">
            {copy.button}
          </Button>
        ) : (
          <Button variant="primary" onClick={onLinkExisting} disabled={isSaving || selectedTxId == null} className="w-full">
            Link this entry
          </Button>
        ))
      }
    >
      {!instance ? (
        <div className="flex justify-center py-space-8 text-body text-ink-muted">Loading…</div>
      ) : (
        <div className="flex flex-col gap-space-5">
          <div className="flex overflow-hidden rounded-lg border border-border text-label" role="tablist">
            {(
              [
                ['new', copy.record],
                ['link', 'Already in the Ledger'],
              ] as const
            ).map(([value, label], i) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  'flex-1 py-space-2 transition-colors duration-150',
                  i > 0 && 'border-l border-border',
                  mode === value ? 'bg-accent-wash font-medium text-accent' : 'text-ink-soft hover:bg-sunken',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-caption text-ink-muted">
            Due {formatShortDate(instance.dueDate)} · from {instance.account.name}
            {toAccount ? ` · into ${toAccount.name}` : ''}
          </p>

          {mode === 'new' ? (
            <>
              {duePassed && (
                <p className="rounded-lg bg-sunken px-space-4 py-space-3 text-caption text-ink-soft">
                  Its due date has passed. If you already paid it and the payment is in your Ledger,{' '}
                  <button type="button" onClick={() => setMode('link')} className="text-accent underline-offset-2 hover:underline">
                    link that entry instead
                  </button>{' '}
                  so the money isn’t counted twice.
                </p>
              )}
              <form
                id="settle-commitment"
                onSubmit={handleSubmit(onRecordNew)}
                onKeyDown={handleEnterAdvance}
                autoComplete="off"
                className="flex flex-col items-center gap-space-6"
              >
                <AmountInput {...register('amount')} error={errors.amount?.message} autoFocus />

                <div className="w-full rounded-lg border border-line">
                  {needsCategory && (
                    <FormRow label="Category" error={errors.categoryId?.message}>
                      <CategorySelect
                        className="-ml-space-1 max-w-full"
                        value={watch('categoryId') ?? ''}
                        categories={categories}
                        onChange={(v) => setValue('categoryId', v ?? undefined, { shouldValidate: true })}
                      />
                    </FormRow>
                  )}
                  {toAccount && (
                    <FormRow label="Into">
                      <span className="text-label text-ink">{toAccount.name}</span>
                    </FormRow>
                  )}
                  <FormRow label={kind === 'INCOME' ? 'Into' : 'From'} error={errors.accountId?.message}>
                    <Select
                      variant="row"
                      className="-ml-space-1 max-w-full"
                      ariaLabel="Account"
                      value={watch('accountId') ? String(watch('accountId')) : ''}
                      placeholder="Choose one"
                      options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
                      onChange={(v) => v && setValue('accountId', Number(v), { shouldValidate: true })}
                    />
                  </FormRow>
                  <FormRow label="Date">
                    <input
                      type="date"
                      {...register('date')}
                      max={today}
                      className="w-full cursor-pointer bg-transparent text-label text-ink outline-none"
                    />
                  </FormRow>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col gap-space-3">
              <p className="text-caption text-ink-soft">
                {copy.entries} {kind === 'INCOME' ? 'into' : 'from'} {instance.account.name}
                {toAccount ? ` into ${toAccount.name}` : ''} within {LINK_WINDOW_DAYS} days of the due date. Pick the one
                that paid this bill.
              </p>
              {loadingCandidates ? (
                <p className="text-body text-ink-muted">Looking in your Ledger…</p>
              ) : candidates.length === 0 ? (
                <p className="text-body text-ink-soft">
                  No {copy.entries.toLowerCase()} {kind === 'INCOME' ? 'into' : 'from'} {instance.account.name} around{' '}
                  {formatShortDate(instance.dueDate)}. If you paid it
                  from another account or haven’t recorded it,{' '}
                  <button type="button" onClick={() => setMode('new')} className="text-accent underline-offset-2 hover:underline">
                    record a new payment
                  </button>
                  .
                </p>
              ) : (
                <div className="rounded-lg border border-line" role="radiogroup" aria-label="Ledger entries">
                  {candidates.map((t) => {
                    const selected = t.id === selectedTxId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSelectedTxId(t.id)}
                        className={cn(
                          'flex w-full items-center gap-space-3 border-b border-line px-space-4 py-space-3 text-left transition-colors last:border-b-0',
                          selected ? 'bg-accent-wash' : 'hover:bg-sunken',
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 rounded-full border',
                            selected ? 'border-[5px] border-accent' : 'border-border',
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-label text-ink">{t.description}</span>
                          <span className="block text-caption text-ink-muted">{formatShortDate(t.date)}</span>
                        </span>
                        <Amount value={t.amount} role="row" className="text-ink" />
                      </button>
                    );
                  })}
                </div>
              )}
              {linkError && <p className="text-caption text-critical">{linkError}</p>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
