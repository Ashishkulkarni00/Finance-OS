import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { CategorySelect } from '@/features/transactions/components/CategorySelect';
import { formatDayMonthYear } from '@/lib/dates';
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
  /** Rendered between "Due on" and "Last payment" - the first payment's month. */
  startSlot?: ReactNode;
  /** Rendered under "Amount" when it changes each month - that occurrence's own amount. */
  amountSlot?: ReactNode;
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
  { value: 'EXPENSE', label: 'Payment - rent, EMI, a bill, family support' },
  { value: 'TRANSFER', label: 'Saving - into my own savings account' },
  { value: 'INVESTMENT', label: 'Investing - SIP or RD' },
  { value: 'INCOME', label: 'Income - salary or money coming in' },
];

const TYPE_HINT = (
  <span className="flex flex-col gap-space-1">
    <span>What this money does:</span>
    <span><strong className="font-medium">Payment</strong> - it leaves you: rent, EMIs, bills, subscriptions, family support. Most things are this.</span>
    <span><strong className="font-medium">Saving</strong> - moved into your own savings account. It's still yours, so it isn't counted as spent.</span>
    <span><strong className="font-medium">Investing</strong> - a SIP or RD going into an investment account.</span>
    <span><strong className="font-medium">Income</strong> - salary or other money you receive.</span>
  </span>
);

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
 * Every field of a commitment, shared by "Add a commitment" and "Edit" so the two can't drift -
 * the add form's rows used to be inline in its sheet.
 *
 * <p>"Type" decides the rest: a bill can be spent (an expense), money moved to your own
 * savings, an investment, or income you expect. Only the accounts and categories that fit
 * are offered, the same rules the Ledger applies when the payment is recorded.
 */
export function CommitmentFields({
  form,
  accounts,
  categories,
  lastPayment,
  startSlot,
  amountSlot,
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
        <FormRow label="Type">{lockedTerms}</FormRow>
      ) : (
        <>
          {lockedSettlement ? (
            <FormRow label="Type">{lockedSettlement}</FormRow>
          ) : (
            <FormRow label="Type" hint={TYPE_HINT}>
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

          <FormRow
            label="Amount"
            hint="Fixed if it's the same every time, like rent or an EMI. Changes each month for things like electricity - you give each month's amount as you learn it."
          >
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="Whether the amount is the same every time"
              value={amountType}
              options={[
                { value: 'FIXED', label: 'Fixed - same every time' },
                { value: 'VARIABLE', label: 'Changes each month - like electricity' },
              ]}
              onChange={(v) => setValue('amountType', v as CommitmentAmountType, { shouldValidate: true })}
            />
          </FormRow>

          {amountType === 'VARIABLE' && amountSlot}

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
                { value: 'QUARTERLY', label: 'Every 3 months' },
                { value: 'ANNUAL', label: 'Every year' },
                ...(allowOnce ? [{ value: 'ONCE', label: 'Just once - it won’t repeat' }] : []),
              ]}
              onChange={(v) => setValue('frequency', v as CommitmentFrequency | 'ONCE', { shouldValidate: true })}
            />
          </FormRow>

          <FormRow
            label={isIncome ? 'Arrives on' : 'Due on'}
            error={errors.dueDay?.message}
            hint={isIncome ? 'The day of the month it usually arrives (1-28).' : 'The day of the month it’s paid (1-28). For one every 3 months or every year, the day in the month it falls due.'}
          >
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
            hint="Only if it ends - like the month of your final EMI. Leave it as “No end” if it keeps going."
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
                <span className="num text-caption text-ink-muted">on {formatDayMonthYear(lastPayment.lastDue)}</span>
              )}
            </span>
          </FormRow>
          )}

          {!once && afterEndSlot}

          <FormRow
            label={isIncome ? 'Arrives in' : 'Paid from'}
            error={errors.accountId?.message}
            hint={isIncome ? 'The account it’s paid into.' : 'The account the money goes out of.'}
          >
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
            <FormRow label="Into" error={errors.toAccountId?.message} hint="Your own account the money goes to - it stays yours.">
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
            income={isIncome}
            onChange={(v) => setValue('categoryId', v)}
          />
        </FormRow>
      )}

      {!isIncome && (
        <FormRow
          label="Must pay?"
          hint="Yes if missing it costs you - a late fee, a penalty, a mark on your credit. No if you could skip it in a tight month."
        >
          <Select
            variant="row"
            className="-ml-space-1 max-w-full"
            ariaLabel="Whether this is mandatory"
            value={watch('mandatory') ? 'yes' : 'no'}
            options={[
              { value: 'yes', label: 'Yes - missing it costs me' },
              { value: 'no', label: 'No - I could skip it' },
            ]}
            onChange={(v) => setValue('mandatory', v === 'yes', { shouldValidate: true })}
          />
        </FormRow>
      )}

      <FormRow label="Note">
        <input {...register('why')} placeholder="Optional - what it's for" className={FORM_ROW_CONTROL} />
      </FormRow>

      {!isIncome && (
        <FormRow label="If skipped" hint="Optional. Shown beside it on Months, so on a tight month you remember what skipping it would mean.">
          <input {...register('ifSkipped')} placeholder="Optional - e.g. late fee of ₹500" className={FORM_ROW_CONTROL} />
        </FormRow>
      )}
    </div>
  );
}
