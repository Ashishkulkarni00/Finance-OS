import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { AccountFormFields } from './AccountFormFields';
import { accountFormSchema, type AccountFormValues, type CreatableAccountType } from './accountForm';
import { useUpdateAccountMutation } from '@/services/accountService';
import { handleEnterAdvance } from '@/lib/formKeyboard';
import type { AccountResponse } from '@/types/api';

/** The account's current values as form values. The balance fields are carried along
 *  unchanged so the shared schema validates - this sheet never sends them. */
function toFormValues(account: AccountResponse): AccountFormValues {
  return {
    name: account.name,
    // SYSTEM accounts are never shown to the user, so every account reaching this sheet
    // is one of the creatable types.
    type: account.type as CreatableAccountType,
    institution: account.institution ?? '',
    lastFour: account.lastFour ?? '',
    openingBalance: account.openingBalance,
    openingAsOf: account.openingAsOf,
    openingConfidence: account.openingConfidence,
    minimumBalance: account.minimumBalance ?? '',
    minimumBalanceMandatory: account.minimumBalanceMandatory,
    includeInSpendable: account.includeInSpendable,
    purpose: account.purpose ?? '',
  };
}

interface EditAccountSheetProps {
  account: AccountResponse;
  open: boolean;
  onClose: () => void;
}

/**
 * "Edit details" - name, bank, last 4, minimum balance, purpose.
 *
 * <p>Not the balance. Changing what an account holds is "Update balance"
 * (`UpdateBalanceSheet`), which resets it to what the bank shows now; mixing the two in
 * one form would make renaming an account a way to accidentally re-base its balance.
 *
 * <p>The server always allowed these edits (`PATCH /accounts/{id}`); nothing in the
 * product offered them, so a typo in a name could only be fixed by creating a second
 * account.
 */
export function EditAccountSheet({ account, open, onClose }: EditAccountSheetProps) {
  const [updateAccount, { isLoading }] = useUpdateAccountMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: toFormValues(account),
  });

  const close = () => {
    onClose();
    reset(toFormValues(account));
  };

  const onSubmit = async (values: AccountFormValues) => {
    try {
      await updateAccount({
        id: account.id,
        body: {
          name: values.name.trim(),
          // An empty string clears these server-side; null would mean "leave unchanged".
          institution: values.institution?.trim() ?? '',
          purpose: values.purpose?.trim() ?? '',
          // Must be exactly four digits when sent, so an emptied field is left unchanged
          // rather than sent as "" and rejected.
          lastFour: values.lastFour || null,
          // null means "leave unchanged" too, so removing a minimum is sent as zero.
          minimumBalance: values.minimumBalance ? values.minimumBalance : account.minimumBalance ? '0' : null,
          minimumBalanceMandatory: values.minimumBalanceMandatory,
          ...(account.type === 'BANK' || account.type === 'CASH' ? { includeInSpendable: values.includeInSpendable } : {}),
        },
      }).unwrap();
      onClose();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      if (appError.field) {
        setError(appError.field as keyof AccountFormValues, { message: appError.message });
      } else {
        setError('name', { message: appError.message ?? "Couldn't save. Try again." });
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Edit ${account.name}`}
      footer={
        <Button type="submit" form="edit-account" variant="primary" disabled={isLoading} className="w-full">
          Save changes
        </Button>
      }
    >
      <form id="edit-account" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-5">
        <AccountFormFields register={register} watch={watch} setValue={setValue} errors={errors} mode="edit" />
        <p className="text-caption text-ink-muted">To change what this account holds, use Update balance instead.</p>
      </form>
    </Modal>
  );
}
