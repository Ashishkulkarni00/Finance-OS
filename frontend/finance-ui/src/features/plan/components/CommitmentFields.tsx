import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { UseFormReturn } from 'react-hook-form';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { CategorySelect } from '@/features/transactions/components/CategorySelect';
import type { AccountResponse, AccountType } from '@/types/api';
import type { CategoryResponse } from '@/types/category';
import type { CommitmentAmountType, CommitmentFrequency, SettleAs } from '@/types/commitmentRule';
import { addMonths, monthLabel, type CommitmentFormValues, type LastPayment } from './commitmentForm';

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
  /** Open "More details" from the start - Edit does when the bill already has a note. */
  detailsOpen?: boolean;
}

const AMOUNT_CHOICES: [CommitmentAmountType, string][] = [
  ['FIXED', 'Same every time'],
  ['VARIABLE', 'Changes every time'],
];

const SETTLE_OPTIONS: { value: SettleAs; label: string }[] = [
  { value: 'EXPENSE', label: 'Payment - rent, EMI, a bill, family support' },
  { value: 'TRANSFER', label: 'Saving - into my own savings account' },
  { value: 'INVESTMENT', label: 'Investing - SIP or RD' },
  { value: 'INCOME', label: 'Income - salary or money coming in' },
];

const TYPE_HINT = (
  <span className="flex flex-col gap-space-1">
    <span><strong className="font-medium">Payment</strong> - it leaves you. Rent, EMIs, bills.</span>
    <span><strong className="font-medium">Saving</strong> - into your own savings. Still yours.</span>
    <span><strong className="font-medium">Investing</strong> - a SIP or RD.</span>
    <span><strong className="font-medium">Income</strong> - money you receive.</span>
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
 * When it ends, as one dropdown: "Keeps going", or "March 2027 · 5 payments".
 *
 * <p>Replaced a month select plus a year select (user, 2026-11-09: "first payment last payment
 * too complicated"). The count is what people actually know about an EMI - "17 left" - so
 * the option that matches it is findable without date arithmetic. Only months a payment
 * actually falls in are offered, so a quarterly bill can't end in a month it skips.
 */
export function LastPaymentPicker({
  lastPayment,
  frequency,
  ariaLabel,
}: {
  lastPayment: LastPayment;
  frequency: string;
  ariaLabel: string;
}) {
  const start = (lastPayment.firstDue ?? new Date().toISOString()).slice(0, 7);
  const step = frequency === 'QUARTERLY' ? 3 : frequency === 'ANNUAL' ? 12 : 1;
  const count = frequency === 'ANNUAL' ? 30 : frequency === 'QUARTERLY' ? 40 : 72;
  const current = lastPayment.endYear && lastPayment.endMonth ? `${lastPayment.endYear}-${lastPayment.endMonth}` : '';
  const options = Array.from({ length: count }, (_, i) => {
    const ym = addMonths(start, i * step);
    return { value: ym, label: `${monthLabel(ym)} · ${i + 1} ${i === 0 ? 'payment' : 'payments'}` };
  });
  // A saved end that isn't on the grid (edited terms, an old rule) must still show as chosen.
  if (current && !options.some((o) => o.value === current)) {
    options.unshift({ value: current, label: monthLabel(current) });
  }
  return (
    <Select
      variant="row"
      className="-ml-space-1 max-w-full"
      ariaLabel={ariaLabel}
      value={current}
      placeholder="Keeps going"
      clearable
      options={options}
      onChange={(v) => lastPayment.setEnd(v ?? '')}
    />
  );
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
  detailsOpen = false,
}: CommitmentFieldsProps) {
  const [moreOpen, setMoreOpen] = useState(detailsOpen);
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
      <FormRow label="Name" error={errors.name?.message}>
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

          {/* One row for the amount, where there were two ("Same every time?" then "How much").
              The choice sits beside the figure it governs, worded as the user would say it
              (2026-11-09: "No - it changes, like electricity" read as a riddle). */}
          <FormRow label="Amount" error={errors.fixedAmount?.message}>
            <span className="flex flex-col gap-space-2">
              <span
                className="inline-flex self-start overflow-hidden rounded-md border border-border text-caption"
                role="radiogroup"
                aria-label="Whether the amount is the same every time"
              >
                {AMOUNT_CHOICES.map(([value, label], i) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={amountType === value}
                    onClick={() => setValue('amountType', value, { shouldValidate: true })}
                    className={cn(
                      'px-space-3 py-space-1 transition-colors duration-150',
                      i > 0 && 'border-l border-border',
                      amountType === value ? 'bg-sunken text-ink' : 'text-ink-muted hover:text-ink-soft',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </span>
              {amountType === 'FIXED' ? (
                <span className="flex items-center gap-space-1">
                  <span className="num text-ink-muted">₹</span>
                  <input
                    {...register('fixedAmount')}
                    inputMode="decimal"
                    placeholder="0"
                    aria-label="Amount every time"
                    className={FORM_ROW_CONTROL + ' num'}
                  />
                </span>
              ) : (
                <span className="text-caption text-ink-muted">You give the amount each time, when the bill comes.</span>
              )}
            </span>
          </FormRow>

          {amountSlot}

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

          {/* No hint: the label and the suffix already say the whole thing. The only fact
              the hint carried that the field didn't was the 1-28 range, which now sits
              inline where it's needed rather than behind an icon. */}
          <FormRow label={isIncome ? 'Arrives on' : 'Due on'} error={errors.dueDay?.message}>
            <span className="flex items-center gap-space-2">
              <input {...register('dueDay')} inputMode="numeric" placeholder="5" className="w-12 bg-transparent text-label text-ink outline-none num" />
              <span className="text-caption text-ink-muted">of the month (1–28)</span>
            </span>
          </FormRow>

          {startSlot}

          {!once && (
            <FormRow label="Ends" error={lastPayment.error ?? undefined}>
              <LastPaymentPicker
                lastPayment={lastPayment}
                frequency={watch('frequency')}
                ariaLabel={isIncome ? 'When the last one arrives' : 'When the last payment is'}
              />
            </FormRow>
          )}

          {!once && afterEndSlot}

          {/* No hint: "Paid from" / "Arrives in" plus a list of your own accounts is the
              whole explanation. */}
          <FormRow label={isIncome ? 'Arrives in' : 'Paid from'} error={errors.accountId?.message}>
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
            <FormRow label="Into" error={errors.toAccountId?.message} hint="Your own account - the money stays yours.">
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

      {/* Category stays out of the fold: a payment or income needs one (each time it's paid, the
          Ledger entry takes it from here), so it can't hide behind "More details". */}
      {settleAs !== 'TRANSFER' && settleAs !== 'INVESTMENT' && (
        <FormRow label="Category" error={errors.categoryId?.message}>
          <CategorySelect
            className="-ml-space-1 max-w-full"
            value={watch('categoryId') ?? ''}
            categories={fittingCategories}
            income={isIncome}
            onChange={(v) => setValue('categoryId', v)}
          />
        </FormRow>
      )}

      {/* Optional details, folded: Must pay? and Note change nothing about when or how much.
          Must pay defaults to Yes, so saving without opening this is a real answer, not a
          skipped one. The closed row says what's currently chosen. */}
      <button
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        aria-expanded={moreOpen}
        className="flex w-full items-center justify-between gap-space-3 border-t border-line px-space-4 py-space-3 text-left"
      >
        <span className="text-label text-ink-soft">More details</span>
        <span className="flex min-w-0 items-center gap-space-2 text-caption text-ink-muted">
          <span className="truncate">
            {[
              !isIncome ? (watch('mandatory') ? 'Must pay' : 'Can skip') : null,
              watch('why') ? 'Note' : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          <ChevronDown size={14} strokeWidth={1.75} aria-hidden className={cn('shrink-0 transition-transform duration-150', moreOpen && 'rotate-180')} />
        </span>
      </button>

      {moreOpen && (
        <>
      {!isIncome && (
        <FormRow
          label="Must pay?"
          hint="Yes if missing it costs you. No if you could skip it in a tight month."
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

        </>
      )}

      {/* "If skipped" was here. Removed by the user 2026-09-21 after living with it: in
          practice it filled up with restatements of the bill's own name ("TV + WiFi will
          not work", "Won't be able to listen add free"), which pushed the facts that
          matter - what's due, from where - off the end of every plan row. "Must pay?"
          already carries the part that changes behaviour. The column and the API field
          stay, and existing answers are left untouched rather than blanked. */}
    </div>
  );
}
