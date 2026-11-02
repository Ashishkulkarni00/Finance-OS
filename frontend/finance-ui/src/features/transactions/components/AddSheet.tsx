import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeAddSheet, showEffect } from '@/store/slices/uiSlice';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { TransactionFormFields } from './TransactionFormFields';
import { activeTransactionType, todayIso, transactionFormSchema, type TransactionFormValues } from './transactionForm';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCategoriesQuery } from '@/services/categoryService';
import { useCreateTransactionMutation } from '@/services/transactionService';
import {
  useGetCommitmentInstancesForCycleQuery,
  useSettleCommitmentInstanceMutation,
} from '@/services/commitmentInstanceService';
import { useGetCurrentCycleQuery } from '@/services/cycleService';
import { handleEnterAdvance } from '@/lib/formKeyboard';

/**
 * The Add button's destination - a full, considered form rather than a bare capture
 * box. See `TransactionFormFields` for the field-level reasoning; this component only
 * owns the parts specific to *creating*: the mutation, and resetting to a blank slate
 * on close rather than leaving stale values for next time.
 */
export function AddSheet() {
  const open = useAppSelector((s) => s.ui.addSheetOpen);
  const dispatch = useAppDispatch();

  const { data: accountsPage } = useGetAccountsQuery();
  const { data: categoriesPage } = useGetCategoriesQuery();
  const [createTransaction, { isLoading }] = useCreateTransactionMutation();
  const [settleInstance] = useSettleCommitmentInstanceMutation();
  const { data: cycle } = useGetCurrentCycleQuery();
  const { data: cycleInstances } = useGetCommitmentInstancesForCycleQuery(cycle?.id ?? 0, { skip: !cycle });

  const accounts = accountsPage?.content.filter((a) => !a.archived) ?? [];
  const categories = categoriesPage?.content.filter((c) => !c.archived) ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      amount: '',
      type: 'EXPENSE',
      accountId: undefined as unknown as number,
      toAccountId: null,
      categoryId: null,
      description: '',
      date: todayIso(),
      note: '',
      settlesInstanceId: null,
    },
  });

  // Open bills this entry could pay: same account, same settle type, still owing. Filtering,
  // not arithmetic - the outstanding figures are the server's own.
  const chosenAccount = watch('accountId');
  const chosenType = watch('type');
  const chosenTo = watch('toAccountId');
  const settleable = (cycleInstances ?? []).filter((i) => {
    if (i.settleAs !== chosenType || i.outstanding == null || Number(i.outstanding) <= 0) return false;
    // Where the money *went* identifies a transfer's bill, not where it came from. Matching
    // on the source alone missed the real case this row was built for: the emergency-fund
    // top-up is set to be paid from Cash wallet, the machine refused the notes, and the
    // make-up transfers came from HDFC Salary - so the bill was never offered and the
    // payments sat in the Ledger unlinked (USAGE_ISSUES U1).
    const fromMatches = i.account.id === chosenAccount;
    const toMatches = i.toAccountId != null && i.toAccountId === chosenTo;
    return fromMatches || toMatches;
  });

  // Pre-fill the account once accounts load - "pre-filled with last used" is the
  // spec's ambition; without a "last used per category" signal yet, the first
  // spendable account is the honest default for now.
  useEffect(() => {
    if (accounts.length > 0 && !getValues('accountId')) {
      setValue('accountId', accounts[0]!.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsPage]);

  // Opened from somewhere that already knows what's being recorded - "Pay bill" on a card
  // - so the form starts filled in rather than asking for it again.
  const prefill = useAppSelector((s) => s.ui.addSheetPrefill);
  useEffect(() => {
    if (!open || !prefill) return;
    if (prefill.type) setValue('type', prefill.type);
    if (prefill.amount) setValue('amount', prefill.amount);
    if (prefill.accountId) setValue('accountId', prefill.accountId);
    if (prefill.toAccountId !== undefined) setValue('toAccountId', prefill.toAccountId);
    if (prefill.description) setValue('description', prefill.description);
    if (prefill.date) setValue('date', prefill.date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill]);

  const close = () => {
    dispatch(closeAddSheet());
    reset();
  };

  const onSubmit = async (values: TransactionFormValues) => {
    const activeType = activeTransactionType(values.type);
    try {
      const saved = await createTransaction({
        date: values.date,
        description: values.description.trim(),
        type: values.type,
        amount: values.amount,
        accountId: values.accountId,
        toAccountId: activeType.needsDestination ? values.toAccountId : null,
        categoryId: activeType.needsCategory ? values.categoryId : null,
        merchant: null,
        note: values.note?.trim() || null,
      }).unwrap();
      // Reported in a toast rather than by holding the sheet: recording a small expense
      // should take one tap, and everything the toast says is also on Needs you, so
      // nothing is lost when it fades (ADR-0017).
      // Settling is a second call, deliberately: the transaction has to exist before a bill
      // can point at it. It runs after the entry is safely saved, so a failure here can
      // never cost the user the entry itself - it is reported, and the bill stays unpaid.
      if (values.settlesInstanceId != null) {
        try {
          await settleInstance({
            id: values.settlesInstanceId,
            transactionId: saved.id,
            amount: values.amount,
          }).unwrap();
        } catch (err) {
          const appError = err as { message?: string };
          setError('settlesInstanceId', {
            message: `Saved, but the bill wasn't marked: ${appError.message ?? 'try settling it from Months'}.`,
          });
          return;
        }
      }
      if (saved.effect) dispatch(showEffect(saved.effect));
      close();
    } catch (err) {
      // Never lose what was typed - the sheet stays open with values intact. SCREEN_SPECS S2.
      const appError = err as { message?: string; field?: string };
      if (appError.field) {
        setError(appError.field as keyof TransactionFormValues, { message: appError.message });
      } else {
        setError('amount', { message: appError.message ?? "Couldn't save. Try again." });
      }
    }
  };

  // "Add expense" beats "Add transaction": the type is already chosen (Expense by
  // default), so the header can say what's actually being recorded instead of naming
  // the database table.
  const title = `Add ${activeTransactionType(watch('type')).label.toLowerCase()}`;

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      footer={
        // Outside the <form> in the DOM; `form="add-transaction"` still submits it.
        <Button type="submit" form="add-transaction" variant="primary" disabled={isLoading} className="w-full">
          Save
        </Button>
      }
    >
      <form id="add-transaction" data-doc="transaction.form" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col items-center gap-space-6">
        <TransactionFormFields
          register={register}
          control={control}
          watch={watch}
          setValue={setValue}
          errors={errors}
          accounts={accounts}
          categories={categories}
          settleable={settleable}
        />
      </form>
    </Modal>
  );
}
