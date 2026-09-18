import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Row } from '@/components/Row';
import { Button } from '@/components/Button';
import { RealBalancePreview } from './RealBalancePreview';
import { Amount } from '@/components/Amount';
import { AccountFormFields } from '@/features/accounts/components/AccountFormFields';
import { accountFormSchema, ACCOUNT_FORM_DEFAULTS, type AccountFormValues } from '@/features/accounts/components/accountForm';
import { useGetAccountsQuery, useCreateAccountMutation } from '@/services/accountService';
import { handleEnterAdvance } from '@/lib/formKeyboard';

interface AccountsStepProps {
  onContinue: () => void;
}

/**
 * Step 2 - "Approximate is fine." Loans and cards are deliberately not offered here;
 * they're prompted afterwards, once the core number works. SCREEN_SPECS S7.
 *
 * <p>Built on the same `AccountFormFields` the Accounts page's own "Add account" sheet
 * uses, restricted to Bank/Cash via `allowedTypes` - the two forms ask the same
 * questions about the same entity, so they can't drift the way a hand-duplicated
 * onboarding form eventually would (this one used to capture three of twelve fields;
 * the shared version captures what Accounts actually needs - see DATA_ENTRY_AUDIT.md).
 */
export function AccountsStep({ onContinue }: AccountsStepProps) {
  const { data: accountsPage } = useGetAccountsQuery();
  const [createAccount, { isLoading }] = useCreateAccountMutation();

  const accounts = accountsPage?.content ?? [];

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
    defaultValues: { ...ACCOUNT_FORM_DEFAULTS, openingConfidence: 'ESTIMATED' },
  });

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
        includeInSpendable: values.type === 'BANK' || values.type === 'CASH' ? values.includeInSpendable : null,
      }).unwrap();
      reset({ ...ACCOUNT_FORM_DEFAULTS, openingConfidence: 'ESTIMATED' });
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      if (appError.field) {
        setError(appError.field as keyof AccountFormValues, { message: appError.message });
      } else {
        setError('name', { message: appError.message ?? "Couldn't add that account." });
      }
    }
  };

  return (
    <div className="flex flex-col gap-space-6">
      <div>
        <h1 className="text-editorial font-serif text-ink">Where is your money?</h1>
        <p className="mt-space-2 text-body text-ink-muted">
          Bank and cash accounts. Approximate is fine - you can refine it later.
        </p>
      </div>

      {accounts.length > 0 && (
        <div className="flex flex-col">
          {accounts.map((a) => (
            <Row key={a.id} primary={a.name} secondary={a.typeLabel} trailing={<Amount value={a.currentBalance} role="row" className="text-ink" />} />
          ))}
        </div>
      )}

      {accounts.length > 0 && <RealBalancePreview />}

      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-4 rounded-xl border border-line bg-surface p-space-5">
        <AccountFormFields
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          allowedTypes={['BANK', 'CASH']}
        />
        <div>
          <Button type="submit" variant="secondary" disabled={isLoading}>
            Add account
          </Button>
        </div>
      </form>

      <div className="flex items-center gap-space-4">
        <Button variant="primary" onClick={onContinue}>
          Continue
        </Button>
        {accounts.length === 0 && (
          <button type="button" onClick={onContinue} className="text-label text-ink-muted hover:text-ink-soft">
            I'll add this later
          </button>
        )}
      </div>
    </div>
  );
}
