import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeAddSheet, showEffect } from '@/store/slices/uiSlice';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { TransactionFormFields } from './TransactionFormFields';
import {
  activeTransactionType,
  eligibleSourceAccounts,
  todayIso,
  transactionFormSchema,
  type TransactionFormValues,
} from './transactionForm';
import { lastAccountFor, rememberAccount, rememberCategory } from '../addMemory';
import { formatMoney } from '@/lib/money';
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

  // The account last used for this kind of entry, else the first valid one. Runs on every open (a
  // closed form is reset, which clears it) and when accounts arrive.
  useEffect(() => {
    if (!open || accounts.length === 0 || getValues('accountId')) return;
    const type = getValues('type');
    const eligible = eligibleSourceAccounts(type, accounts);
    const remembered = lastAccountFor(type);
    const pick = eligible.find((a) => a.id === remembered) ?? eligible[0] ?? accounts[0];
    if (pick) setValue('accountId', pick.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accountsPage]);

  // "Save & add another" keeps the sheet open; this says what was just recorded, because the
  // effect toast sits behind an open sheet. Cleared as soon as the next amount is typed.
  const addAnother = useRef(false);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [cleanToken, setCleanToken] = useState(0);
  const typedAmount = watch('amount');
  useEffect(() => {
    if (typedAmount) setJustSaved(null);
  }, [typedAmount]);

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
    setJustSaved(null);
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
      rememberAccount(values.type, values.accountId);
      if (activeType.needsCategory && values.categoryId != null) rememberCategory(values.type, values.categoryId);
      if (saved.effect) dispatch(showEffect(saved.effect));
      if (addAnother.current) {
        // Same kind of entry, same account, same day; the rest starts blank.
        setJustSaved(`Recorded ${formatMoney(values.amount)} · ${values.description.trim()}. Add the next one.`);
        reset({
          amount: '',
          type: values.type,
          accountId: values.accountId,
          toAccountId: values.toAccountId,
          categoryId: null,
          description: '',
          date: values.date,
          note: '',
          settlesInstanceId: null,
        });
        setCleanToken((n) => n + 1);
        requestAnimationFrame(() => document.querySelector<HTMLInputElement>('#add-transaction input[inputmode="decimal"]')?.focus());
        return;
      }
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
      size="narrow"
      cleanToken={cleanToken}
      footer={
        // Outside the <form> in the DOM; `form="add-transaction"` still submits it. Two ways to
        // save: Save closes the sheet; Save & add another keeps it for the next entry.
        <div className="flex gap-space-2">
          <Button
            type="submit"
            form="add-transaction"
            variant="secondary"
            disabled={isLoading}
            onClick={() => {
              addAnother.current = true;
            }}
          >
            Save &amp; add another
          </Button>
          <Button
            type="submit"
            form="add-transaction"
            variant="primary"
            disabled={isLoading}
            title="Save (Ctrl+Enter)"
            className="flex-1"
            onClick={() => {
              addAnother.current = false;
            }}
          >
            Save
          </Button>
        </div>
      }
    >
      <form id="add-transaction" data-doc="transaction.form" onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => {
          // Ctrl/Cmd+Enter saves from anywhere in the form; plain Enter moves to the next field.
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            addAnother.current = false;
            e.currentTarget.requestSubmit();
            return;
          }
          handleEnterAdvance(e);
        }} autoComplete="off" className="flex flex-col items-center gap-space-6">
        {justSaved && (
          <p role="status" className="w-full rounded-lg bg-positive-wash px-space-3 py-space-2 text-caption text-positive">
            {justSaved}
          </p>
        )}
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
