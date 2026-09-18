import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { AccountFormFields } from './AccountFormFields';
import { accountFormSchema, ACCOUNT_FORM_DEFAULTS, type AccountFormValues } from './accountForm';
import { useCreateAccountMutation } from '@/services/accountService';
import { handleEnterAdvance } from '@/lib/formKeyboard';

interface CreateAccountSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "Add account" - reachable from the Accounts page itself, not only from onboarding.
 *
 * <p>Before this, an account could only ever be created during the one-time onboarding
 * wizard; opening a second bank account, or recording a card or a loan as an account,
 * had no entry point afterwards (DATA_ENTRY_AUDIT.md §1: "setup is not a wizard" - every
 * register should own its own add affordance, reused by onboarding rather than the other
 * way round). This sheet and `AccountsStep` share `AccountFormFields` so they can't
 * drift into asking two different things for the same entity.
 */
export function CreateAccountSheet({ open, onClose }: CreateAccountSheetProps) {
  const [createAccount, { isLoading }] = useCreateAccountMutation();

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
    defaultValues: ACCOUNT_FORM_DEFAULTS,
  });

  const close = () => {
    onClose();
    reset(ACCOUNT_FORM_DEFAULTS);
  };

  const onSubmit = async (values: AccountFormValues) => {
    try {
      await createAccount({
        name: values.name.trim(),
        type: values.type,
        institution: values.institution?.trim() || null,
        lastFour: values.lastFour || null,
        openingBalance: values.openingBalance,
        openingAsOf: values.openingAsOf,
        openingConfidence: values.openingConfidence,
        minimumBalance: values.minimumBalance || null,
        minimumBalanceMandatory: values.minimumBalanceMandatory,
        purpose: values.purpose?.trim() || null,
        // Only bank and cash can be spending money; for other types the server's own
        // default (never spendable) applies.
        includeInSpendable: values.type === 'BANK' || values.type === 'CASH' ? values.includeInSpendable : null,
      }).unwrap();
      close();
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
      title="Add account"
      footer={
        <Button type="submit" form="add-account" variant="primary" disabled={isLoading} className="w-full">
          Save
        </Button>
      }
    >
      <form id="add-account" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-6">
        <AccountFormFields register={register} watch={watch} setValue={setValue} errors={errors} />
      </form>
    </Modal>
  );
}
