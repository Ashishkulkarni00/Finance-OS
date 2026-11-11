import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { requestDelete, UNDO_WINDOW_MS } from '../pendingDelete';
import { TransactionFormFields } from '@/features/transactions/components/TransactionFormFields';
import {
  activeTransactionType,
  transactionFormSchema,
  transactionToFormValues,
  type TransactionFormValues,
} from '@/features/transactions/components/transactionForm';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCategoriesQuery } from '@/services/categoryService';
import { useUpdateTransactionMutation } from '@/services/transactionService';
import type { TransactionResponse } from '@/types/transaction';
import { handleEnterAdvance } from '@/lib/formKeyboard';

interface EditTransactionSheetProps {
  transaction: TransactionResponse | null;
  onClose: () => void;
}

/**
 * The Ledger row's click target - D3: inline edit via the existing `PATCH
 * /transactions/{id}`, not a read-only detail page. Half the source workbook's Notes
 * column is corrections ("App had this under Mobile recharge — corrected to Drinks");
 * a ledger you can't correct just relocates the problem instead of fixing it
 * (LEDGER_EXPERIENCE.md §11 D3).
 *
 * <p>Built on the same `TransactionFormFields` as `AddSheet` - same fields, same
 * validation, same visual craft - so editing an entry doesn't feel like a different,
 * lesser product from adding one.
 *
 * <p>The caller must remount this per transaction (a `key={transaction?.id}` on the
 * element) rather than leaving one instance open across clicks. `useForm`'s
 * `defaultValues` only ever seeds a form at its own mount, not on a later prop change -
 * without the fresh mount, clicking a second row reused the first row's form instance
 * with stale values for one render, which is exactly how this crashed once already.
 * Keying by transaction id turns "update this form" into "mount a new, already-correct
 * form", which removes the race instead of patching around it.
 */
export function EditTransactionSheet({ transaction, onClose }: EditTransactionSheetProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { data: accountsPage } = useGetAccountsQuery();
  const { data: categoriesPage } = useGetCategoriesQuery();
  const [updateTransaction, { isLoading: isSaving }] = useUpdateTransactionMutation();
  const dispatch = useAppDispatch();
  const offline = useAppSelector((s) => s.connectivity.offline);

  const accounts = accountsPage?.content.filter((a) => !a.archived) ?? [];
  const categories = categoriesPage?.content.filter((c) => !c.archived) ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: transaction ? transactionToFormValues(transaction) : undefined,
  });

  if (!transaction) return null;

  const activeType = activeTransactionType(watch('type'));

  const close = () => {
    setConfirmingDelete(false);
    onClose();
  };

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      await updateTransaction({
        id: transaction.id,
        body: {
          date: values.date,
          description: values.description.trim(),
          type: values.type,
          amount: values.amount,
          accountId: values.accountId,
          toAccountId: activeType.needsDestination ? values.toAccountId : null,
          categoryId: activeType.needsCategory ? values.categoryId : null,
          // Empty string, not null - the backend's PATCH treats null as "leave
          // unchanged" (UpdateTransactionRequest's own contract), so null here would
          // silently fail to clear a note the user just emptied out.
          note: values.note?.trim() ?? '',
        },
      }).unwrap();
      close();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      if (appError.field) {
        setError(appError.field as keyof TransactionFormValues, { message: appError.message });
      } else {
        setError('amount', { message: appError.message ?? "Couldn't save. Try again." });
      }
    }
  };

  // Not deleted here: this hands the entry to the pending-delete flow (a short undo window, then
  // the request, and only then "Entry deleted"). The sheet closes at once so the entry is visible,
  // dimmed, in the list with the Undo toast beside it.
  const onDelete = () => {
    dispatch(requestDelete({ id: transaction.id, description: transaction.description }));
    close();
  };

  return (
    <>
    <Modal
      open
      onClose={close}
      title={`Edit ${activeType.label.toLowerCase()}`}
      footer={
        <div className="flex w-full items-center gap-space-3">
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={offline}
            title={offline ? "Can't delete while the server can't be reached" : undefined}
            className="text-label text-critical transition-opacity duration-150 hover:opacity-80 disabled:opacity-40"
          >
            Delete
          </button>
          <Button type="submit" form="edit-transaction" variant="primary" disabled={isSaving} className="flex-1">
            Save
          </Button>
        </div>
      }
    >
      <form id="edit-transaction" data-doc="transaction.form" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col items-center gap-space-6">
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
    <Dialog
      open={confirmingDelete}
      title="Delete this entry?"
      body={`It is removed from your Ledger and your balances. If it paid a commitment, that commitment shows as unpaid again. You will have ${UNDO_WINDOW_MS / 1000} seconds to undo.`}
      confirmLabel="Delete"
      destructive
      onConfirm={onDelete}
      onCancel={() => setConfirmingDelete(false)}
    />
    </>
  );
}
