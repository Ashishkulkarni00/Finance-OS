import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeAddSheet } from '@/store/slices/uiSlice';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { TransactionFormFields } from './TransactionFormFields';
import { activeTransactionType, todayIso, transactionFormSchema, type TransactionFormValues } from './transactionForm';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCategoriesQuery } from '@/services/categoryService';
import { useCreateTransactionMutation } from '@/services/transactionService';
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
    },
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
      await createTransaction({
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
      <form id="add-transaction" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col items-center gap-space-6">
        <TransactionFormFields
          register={register}
          control={control}
          watch={watch}
          setValue={setValue}
          errors={errors}
          accounts={accounts}
          categories={categories}
        />
      </form>
    </Modal>
  );
}
