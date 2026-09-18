import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { CategorySelect } from '@/features/transactions/components/CategorySelect';
import { formatShortDate } from '@/lib/dates';
import type { AccountResponse, AccountType } from '@/types/api';
import type { CategoryResponse } from '@/types/category';
import type { CommitmentAmountType, CommitmentFrequency, SettleAs } from '@/types/commitmentRule';
import { MONTH_NAMES, type CommitmentFormValues, type LastPayment } from './commitmentForm';

interface CommitmentFieldsProps {
  form: UseFormReturn<CommitmentFormValues>;
  /** Every usable account - the rows below pick the ones that fit how the bill is paid. */
  accounts: AccountResponse[];
  /** Every usable category - income ones are offered only for expected income. */
  categories: CategoryResponse[];
  lastPayment: LastPayment;
  /** Rendered between "Due on" and "Last payment" - Add's "Starts". */
  startSlot?: ReactNode;
  /** Rendered after "Last payment" - Add's "count this month?" question. */
  afterEndSlot?: ReactNode;
  autoFocus?: boolean;
  /** Offer "Once" - a one-off item in a single month (Add, and editing a one-off). */
  allowOnce?: boolean;
  /** When the bill follows a loan or holding: replaces how it's paid, amount, frequency,
   *  day, start, last payment and accounts with this read-only summary. */
  lockedTerms?: ReactNode;
  /** When the bill funds a goal: replaces "Paid as" and "Into" - the money goes to the
   *  goal's account, as a transfer. The amount and day stay the bill's own. */
  lockedSettlement?: ReactNode;
}

const SETTLE_OPTIONS: { value: SettleAs; label: string }[] = [
  { value: 'EXPENSE', label: 'Spent - rent, an EMI, a subscription' },
  { value: 'TRANSFER', label: 'Moved to my own account - savings' },
  { value: 'INVESTMENT', label: 'Invested - a SIP or RD' },
  { value: 'INCOME', label: 'Money coming in - salary' },
];

/** Mirrors TransactionType.acceptsSource / acceptsDestination on the server. */
const SOURCE_TYPES: Record<SettleAs, AccountType[]> = {
  EXPENSE: ['BANK', 'CASH', 'CREDIT_CARD'],
  TRANSFER: ['BANK', 'CASH'],
  INVESTMENT: ['BANK', 'CASH'],
  INCOME: ['BANK', 'CASH'],
};
const DESTINATION_TYPES: Partial<Record<SettleAs, AccountType[]>> = {
  TRANSFER: ['BANK', 'CASH', 'CREDIT_CARD', 'LOAN', 'INVESTMENT'],
  INVESTMENT: ['INVESTMENT'],
};

/** Accounts a bill paid this way can leave from. */
export function sourceAccountsFor(settleAs: SettleAs, accounts: AccountResponse[]): AccountResponse[] {
  return accounts.filter((a) => SOURCE_TYPES[settleAs].includes(a.type));
}

/**
 * Every field of a bill, shared by "Add a bill" and "Edit bill" so the two can't drift -
 * the add form's rows used to be inline in its sheet.
 *
 * <p>"Paid as" decides the rest: a bill can be spent (an expense), money moved to your own
 * savings, an investment, or income you expect. Only the accounts and categories that fit
 * are offered, the same rules the Ledger applies when the payment is recorded.
 */
export function CommitmentFields({
  form,
  accounts,
  categories,
  lastPayment,
  startSlot,
  afterEndSlot,
  autoFocus,
  allowOnce,
  lockedTerms,
  lockedSettlement,
}: CommitmentFieldsProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const amountType = watch('amountType');
  const settleAs = watch('settleAs');
  const accountId = watch('accountId');
  const isIncome = settleAs === 'INCOME';
  const once = watch('frequency') === 'ONCE';

  const sources = sourceAccountsFor(settleAs, accounts);
  const destinationTypes = DESTINATION_TYPES[settleAs];
  const destinations = destinationTypes ? accounts.filter((a) => destinationTypes.includes(a.type) && a.id !== accountId) : [];
  const fittingCategories = categories.filter((c) => (isIncome ? c.group === 'INCOME' : c.group !== 'INCOME'));

  const changeSettleAs = (next: SettleAs) => {
    setValue('settleAs', next, { shouldValidate: true });
    setValue('toAccountId', null, { shouldValidate: true });
    // Keep only what still fits: a card can't pay a transfer; income takes income categories.
    const account = accounts.find((a) => a.id === accountId);
    if (account && !SOURCE_TYPES[next].includes(account.type)) {
      setValue('accountId', undefined as unknown as number);
    }
    const category = categories.find((c) => c.id === watch('categoryId'));
    if (category && (category.group === 'INCOME') !== (next === 'INCOME')) {
      setValue('categoryId', null);
    }
    if (next === 'INCOME') {
      setValue('mandatory', true);
    }
  };

  return (
    <div className="rounded-lg border border-line">
      <FormRow label="What" error={errors.name?.message}>
        <input {...register('name')} autoComplete="off" placeholder="Rent, Netflix, family support…" className={FORM_ROW_CONTROL} autoFocus={autoFocus} />
      </FormRow>

      {lockedTerms ? (
        <FormRow label="Paid as">{lockedTerms}</FormRow>
      ) : (
        <>
          {lockedSettlement ? (
            <FormRow label="Paid as">{lockedSettlement}</FormRow>
          ) : (
            <FormRow label="Paid as" hint="What happens to the money: spent, moved to your own savings, invested, or coming in.">
              <Select
                variant="row"
                className="-ml-space-1 max-w-full"
                ariaLabel="How this bill is paid"
                value={settleAs}
                options={SETTLE_OPTIONS}
                onChange={(v) => changeSettleAs(v as SettleAs)}
              />
            </FormRow>
          )}

          <FormRow label="Amount">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="Whether the amount is the same every time"
              value={amountType}
              options={[
                { value: 'FIXED', label: 'Same every time' },
                { value: 'VARIABLE', label: 'Varies - a bill I read each month' },
              ]}
              onChange={(v) => setValue('amountType', v as CommitmentAmountType, { shouldValidate: true })}
            />
          </FormRow>

          {amountType === 'FIXED' && (
            <FormRow label="How much" error={errors.fixedAmount?.message}>
              <span className="flex items-center gap-space-1">
                <span className="num text-ink-muted">₹</span>
                <input {...register('fixedAmount')} inputMode="decimal" placeholder="0" className={FORM_ROW_CONTROL + ' num'} />
              </span>
            </FormRow>
          )}

          <FormRow label="How often">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="How often it falls due"
              value={watch('frequency')}
              options={[
                { value: 'MONTHLY', label: 'Every month' },
                { value: 'QUARTERLY', label: 'Every quarter' },
                { value: 'ANNUAL', label: 'Every year - repeats each year' },
                ...(allowOnce ? [{ value: 'ONCE', label: 'Just once - only this month, never again' }] : []),
              ]}
              onChange={(v) => setValue('frequency', v as CommitmentFrequency | 'ONCE', { shouldValidate: true })}
            />
          </FormRow>

          <FormRow label={isIncome ? 'Arrives on' : 'Due on'} error={errors.dueDay?.message}>
            <span className="flex items-center gap-space-2">
              <input {...register('dueDay')} inputMode="numeric" placeholder="5" className="w-12 bg-transparent text-label text-ink outline-none num" />
              <span className="text-caption text-ink-muted">of the month</span>
            </span>
          </FormRow>

          {startSlot}

          {!once && (
          <FormRow
            label={isIncome ? 'Last one' : 'Last payment'}
            error={lastPayment.error ?? undefined}
            hint="The month of the final payment, like your last EMI; leave it blank if the bill has no end."
          >
            <span className="flex flex-wrap items-center gap-space-2">
              <Select
                variant="row"
                className="-ml-space-1"
                ariaLabel="Month of the last payment"
                value={lastPayment.endMonth}
                placeholder="No end"
                clearable
                options={MONTH_NAMES.map((name, i) => ({ value: String(i + 1).padStart(2, '0'), label: name }))}
                onChange={lastPayment.setEndMonth}
              />
              <Select
                variant="row"
                ariaLabel="Year of the last payment"
                value={lastPayment.endYear}
                placeholder="Year"
                clearable
                options={lastPayment.yearOptions}
                onChange={lastPayment.setEndYear}
              />
              {lastPayment.lastDue && !lastPayment.error && (
                <span className="text-caption text-ink-muted">last one {formatShortDate(lastPayment.lastDue)}</span>
              )}
            </span>
          </FormRow>
          )}

          {!once && afterEndSlot}

          <FormRow label={isIncome ? 'Arrives in' : 'Leaves from'} error={errors.accountId?.message}>
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel={isIncome ? 'Account it arrives in' : 'Account this leaves from'}
              value={accountId ? String(accountId) : ''}
              placeholder="Choose one"
              options={sources.map((a) => ({ value: String(a.id), label: a.name }))}
              onChange={(v) => v && setValue('accountId', Number(v), { shouldValidate: true })}
            />
          </FormRow>

          {destinationTypes && !lockedSettlement && (
            <FormRow label="Into" error={errors.toAccountId?.message}>
              <Select
                variant="row"
                className="-ml-space-1 max-w-full"
                ariaLabel="Account the money goes into"
                value={watch('toAccountId') ? String(watch('toAccountId')) : ''}
                placeholder={settleAs === 'INVESTMENT' ? 'Choose the investment account' : 'Choose your account'}
                options={destinations.map((a) => ({ value: String(a.id), label: a.name }))}
                onChange={(v) => setValue('toAccountId', v ? Number(v) : null, { shouldValidate: true })}
              />
            </FormRow>
          )}
        </>
      )}

      {settleAs !== 'TRANSFER' && settleAs !== 'INVESTMENT' && (
        <FormRow label="Category">
          <CategorySelect
            className="-ml-space-1 max-w-full"
            value={watch('categoryId') ?? ''}
            categories={fittingCategories}
            onChange={(v) => setValue('categoryId', v)}
          />
        </FormRow>
      )}

      {!isIncome && (
        <FormRow label="Must pay?">
          <Select
            variant="row"
            className="-ml-space-1 max-w-full"
            ariaLabel="Whether this is mandatory"
            value={watch('mandatory') ? 'yes' : 'no'}
            options={[
              { value: 'yes', label: 'Yes - there are consequences' },
              { value: 'no', label: 'No - I could skip it' },
            ]}
            onChange={(v) => setValue('mandatory', v === 'yes', { shouldValidate: true })}
          />
        </FormRow>
      )}

      <FormRow label="Why">
        <input {...register('why')} placeholder="Optional - why this matters" className={FORM_ROW_CONTROL} />
      </FormRow>

      {!isIncome && (
        <FormRow label="If skipped">
          <input {...register('ifSkipped')} placeholder="Optional - 'Family depends on it'" className={FORM_ROW_CONTROL} />
        </FormRow>
      )}
    </div>
  );
}
