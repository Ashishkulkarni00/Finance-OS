import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { ACCOUNT_TYPES, todayIso, type AccountFormValues, type CreatableAccountType } from './accountForm';
import { cn } from '@/lib/cn';
import type { BalanceConfidence } from '@/types/api';

const CONFIDENCE_OPTIONS: { value: BalanceConfidence; label: string }[] = [
  { value: 'CONFIRMED', label: 'Confirmed - read off the bank' },
  { value: 'ESTIMATED', label: 'Estimated - a considered figure' },
  { value: 'UNKNOWN', label: "Unknown - I'm not sure" },
];

interface AccountFormFieldsProps {
  register: UseFormRegister<AccountFormValues>;
  watch: UseFormWatch<AccountFormValues>;
  setValue: UseFormSetValue<AccountFormValues>;
  errors: FieldErrors<AccountFormValues>;
  /** Restricts the type selector - onboarding only offers Bank/Cash; loans and cards
   *  are prompted afterwards, once the core number works (SCREEN_SPECS S7). Omit for
   *  the full set. */
  allowedTypes?: CreatableAccountType[];
  /** `edit` shows only the account's details. The type selector is hidden because an
   *  account's type is fixed once created (changing it would re-sign every figure already
   *  derived from it), and the balance rows are hidden because a balance is changed
   *  through "Update balance" - a reset to what the bank shows now - not by editing the
   *  opening figure in place. */
  mode?: 'create' | 'edit';
}

/**
 * The fields shared by the Accounts page's "Add account" sheet and onboarding's
 * account step - one definition so the two can't drift the way the transaction forms
 * once had (`transactionForm.ts`'s own history).
 *
 * <p>Before this, onboarding's inline form captured three of the twelve fields
 * `CreateAccountRequest` accepts - name, type, balance - and there was no way to supply
 * the rest anywhere, ever. `NeedsALookZone` on Accounts warns "X is below the minimum
 * the bank requires" against a figure the product had no way to collect
 * (DATA_ENTRY_AUDIT.md §3, §7). Institution, minimum balance and whether it's mandatory,
 * and the opening date's own confidence are asked here because each already drives
 * something the Accounts page shows.
 *
 * <p>Deliberately still not everything `CreateAccountRequest` accepts:
 * `includeInSpendable`/`includeInNetWorth` have sensible per-type defaults on the
 * backend and are left to an edit flow rather than asked of every new account.
 */
export function AccountFormFields({ register, watch, setValue, errors, allowedTypes, mode = 'create' }: AccountFormFieldsProps) {
  const type = watch('type');
  const types = allowedTypes ? ACCOUNT_TYPES.filter((t) => allowedTypes.includes(t.value)) : ACCOUNT_TYPES;
  const opensNegative = type === 'CREDIT_CARD' || type === 'LOAN';
  const hasMinimum = !!watch('minimumBalance');

  return (
    <div className="flex w-full flex-col gap-space-5">
      {mode === 'create' && types.length > 1 && (
        <div className="flex overflow-hidden rounded-lg border border-border">
          {types.map((t, i) => {
            const selected = type === t.value;
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setValue('type', t.value, { shouldValidate: true })}
                className={cn(
                  'flex flex-1 flex-col items-center gap-space-1 py-space-2 text-micro transition-colors duration-150',
                  i > 0 && 'border-l border-border',
                  selected ? 'bg-accent-wash text-accent' : 'text-ink-muted hover:bg-sunken hover:text-ink-soft',
                )}
              >
                <Icon size={16} strokeWidth={1.75} />
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-line">
        <FormRow label="Name" error={errors.name?.message}>
          <input {...register('name')} autoComplete="off" placeholder="HDFC Salary, Cash Wallet…" className={FORM_ROW_CONTROL} autoFocus />
        </FormRow>

        <FormRow label="Institution" error={errors.institution?.message}>
          <input {...register('institution')} autoComplete="off" placeholder="Optional - HDFC, IDBI…" className={FORM_ROW_CONTROL} />
        </FormRow>

        {(type === 'BANK' || type === 'CREDIT_CARD') && (
          <FormRow label="Last 4" error={errors.lastFour?.message}>
            <input {...register('lastFour')} inputMode="numeric" placeholder="Optional" maxLength={4} className={FORM_ROW_CONTROL} />
          </FormRow>
        )}

        {mode === 'create' && (
          <>
            <FormRow label={opensNegative ? 'Owed today' : 'Balance today'} error={errors.openingBalance?.message}>
              <span className="flex items-center gap-space-1">
                <span className="num text-ink-muted">₹</span>
                <input
                  {...register('openingBalance')}
                  inputMode="decimal"
                  placeholder={opensNegative ? 'e.g. -12000 if money is owed' : '0'}
                  className={FORM_ROW_CONTROL + ' num'}
                />
              </span>
            </FormRow>

            <FormRow label="As of">
              <input type="date" {...register('openingAsOf')} max={todayIso()} className={FORM_ROW_CONTROL + ' cursor-pointer'} />
            </FormRow>

            <FormRow label="How sure?" error={errors.openingConfidence?.message}>
              <Select
                variant="row"
                className="-ml-space-1 max-w-full"
                ariaLabel="How sure are you of this figure"
                value={watch('openingConfidence')}
                options={CONFIDENCE_OPTIONS}
                onChange={(v) => setValue('openingConfidence', v as BalanceConfidence, { shouldValidate: true })}
              />
            </FormRow>
          </>
        )}

        {type === 'BANK' && (
          <>
            <FormRow label="Minimum" error={errors.minimumBalance?.message}>
              <span className="flex items-center gap-space-1">
                <span className="num text-ink-muted">₹</span>
                <input
                  {...register('minimumBalance')}
                  inputMode="decimal"
                  placeholder="Optional - a balance the bank requires"
                  className={FORM_ROW_CONTROL + ' num'}
                />
              </span>
            </FormRow>

            {hasMinimum && (
              <FormRow label="Mandatory?">
                <span className="inline-flex h-8 overflow-hidden rounded-full border border-border text-label">
                  {[
                    { value: true, label: 'Yes - the bank enforces it' },
                    { value: false, label: 'No - my own target' },
                  ].map((o) => (
                    <button
                      key={String(o.value)}
                      type="button"
                      onClick={() => setValue('minimumBalanceMandatory', o.value, { shouldValidate: true })}
                      className={cn(
                        'px-space-3 transition-colors duration-150',
                        watch('minimumBalanceMandatory') === o.value
                          ? 'bg-accent-wash font-medium text-accent'
                          : 'text-ink-soft hover:bg-sunken',
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </span>
              </FormRow>
            )}
          </>
        )}

        {/* Asked of every bank and cash account, on creation and when editing. An
            emergency fund or FD account is real money but not money to spend; left counted,
            it inflates Room left and what's free this month by its whole balance. */}
        {(type === 'BANK' || type === 'CASH') && (
          <FormRow label="Spending money?">
            <span className="inline-flex h-8 overflow-hidden rounded-full border border-border text-label">
              {[
                { value: true, label: 'Yes - day to day' },
                { value: false, label: 'No - savings' },
              ].map((o) => (
                <button
                  key={String(o.value)}
                  type="button"
                  onClick={() => setValue('includeInSpendable', o.value, { shouldValidate: true })}
                  className={cn(
                    'px-space-3 transition-colors duration-150',
                    watch('includeInSpendable') === o.value ? 'bg-accent-wash font-medium text-accent' : 'text-ink-soft hover:bg-sunken',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </span>
            <span className="mt-space-1 block text-caption text-ink-muted">
              {watch('includeInSpendable')
                ? 'Counts toward Room left and what’s free this month.'
                : 'Still counts in net worth, but never toward Room left or what’s free this month.'}
            </span>
          </FormRow>
        )}

        <FormRow label="Purpose">
          <input {...register('purpose')} placeholder="Optional - what this account is for" className={FORM_ROW_CONTROL} />
        </FormRow>
      </div>
    </div>
  );
}
