import { Controller } from 'react-hook-form';
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Amount } from '@/components/Amount';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL as ROW_CONTROL } from '@/components/FormRow';
import { AmountInput } from './AmountInput';
import { CategorySelect } from './CategorySelect';
import {
  TRANSACTION_TYPES,
  activeTransactionType,
  todayIso,
  eligibleSourceAccounts,
  eligibleDestinationAccounts,
  eligibleCategories,
  type TransactionFormValues,
} from './transactionForm';
import { cn } from '@/lib/cn';
import type { AccountResponse } from '@/types/api';
import type { CategoryResponse } from '@/types/category';

interface TransactionFormFieldsProps {
  register: UseFormRegister<TransactionFormValues>;
  control: Control<TransactionFormValues>;
  watch: UseFormWatch<TransactionFormValues>;
  setValue: UseFormSetValue<TransactionFormValues>;
  errors: FieldErrors<TransactionFormValues>;
  accounts: AccountResponse[];
  categories: CategoryResponse[];
}

/** A select that sits in a row without a box of its own - the shared `Select`'s
 *  borderless variant, so it stays identical to every other dropdown in the product. */
function RowSelect({
  value,
  onChange,
  // A real listbox shows nothing when nothing is chosen, where the native `<select>` it
  // replaced used to display its first option regardless - which looked like a selection
  // the form had not actually made. This is what that blank now says instead.
  placeholder = 'Choose one',
  options,
  ariaLabel,
}: {
  value: number | '';
  onChange: (v: number | null) => void;
  placeholder?: string;
  options: { id: number; name: string }[];
  ariaLabel?: string;
}) {
  return (
    <Select
      variant="row"
      // Deliberately not w-full - see the `row` box styles in Select.tsx.
      className="-ml-space-1 max-w-full"
      ariaLabel={ariaLabel}
      value={value === '' ? '' : String(value)}
      placeholder={placeholder}
      options={options.map((o) => ({ value: String(o.id), label: o.name }))}
      onChange={(v) => onChange(v ? Number(v) : null)}
    />
  );
}

/**
 * The fields shared by `AddSheet` and `EditTransactionSheet` - one definition so the
 * two forms can't visually or behaviourally drift the way they already had once
 * (different required-field rules; see `transactionForm.ts`).
 *
 * <p>Three blocks, in the order a person actually decides them: <strong>what kind</strong>
 * of movement this is (a segmented control, because it governs which rows appear below),
 * <strong>how much</strong> (the hero figure, with the chosen account's available balance
 * under it), then <strong>the particulars</strong> as one ruled list.
 *
 * <p>Earlier versions splayed types and categories out as two separate clusters of
 * wrapping pills. With five types and any real number of categories that's a dozen-odd
 * loose chips in a 448px column - it reads as scattered rather than organised, and it
 * gets worse with every category the user adds. A dropdown inside a ruled row costs one
 * line whatever the list length.
 */
export function TransactionFormFields({ register, control, watch, setValue, errors, accounts, categories }: TransactionFormFieldsProps) {
  const type = watch('type');
  const accountId = watch('accountId');
  const toAccountId = watch('toAccountId');
  const categoryId = watch('categoryId');
  const activeType = activeTransactionType(type);

  // Filtered, not the full list - a loan account simply never appears as something to
  // spend from, rather than being offered and then rejected on submit
  // (LEDGER_IMPROVEMENT_PLAN §2 P1; TransactionType.acceptsSource/acceptsDestination
  // on the backend is the source of truth this mirrors).
  const sourceAccounts = eligibleSourceAccounts(type, accounts);
  const destinationAccounts = eligibleDestinationAccounts(type, accounts);
  const pickableCategories = eligibleCategories(type, categories);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedToAccount = accounts.find((a) => a.id === toAccountId);

  /** Switching type can make the current account/category/destination ineligible -
   *  e.g. Expense → Transfer leaves a Credit Card source selected, which Transfer
   *  doesn't accept as a source. Cleared rather than left to fail on submit, so the
   *  picker itself always shows a value that's actually valid for what's selected. */
  const selectType = (next: TransactionFormValues['type']) => {
    setValue('type', next, { shouldValidate: true });
    if (accountId != null && !eligibleSourceAccounts(next, accounts).some((a) => a.id === accountId)) {
      setValue('accountId', undefined as unknown as number);
    }
    if (toAccountId != null && !eligibleDestinationAccounts(next, accounts).some((a) => a.id === toAccountId)) {
      setValue('toAccountId', null);
    }
    if (categoryId != null && !eligibleCategories(next, categories).some((c) => c.id === categoryId)) {
      setValue('categoryId', null);
    }
  };

  const amountTintClass = activeType.tint === 'positive' ? 'text-positive' : activeType.tint === 'critical' ? 'text-critical' : 'text-ink';

  return (
    <div className="flex w-full flex-col gap-space-5">
      <div className="flex overflow-hidden rounded-lg border border-border">
        {TRANSACTION_TYPES.map((t, i) => {
          const selected = type === t.value;
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => selectType(t.value)}
              aria-pressed={selected}
              className={cn(
                'flex flex-1 flex-col items-center gap-space-1 py-space-2 text-micro transition-colors duration-150',
                i > 0 && 'border-l border-border',
                !selected && 'text-ink-muted hover:bg-sunken hover:text-ink-soft',
                // The one place colour carries meaning while entering, not just viewing:
                // Expense and Income get their own hue so which direction you're
                // recording is legible at a glance - Transfer/Investment stay neutral,
                // matching how the Ledger already colours a settled row of each kind.
                selected && t.tint === 'critical' && 'bg-critical/10 text-critical',
                selected && t.tint === 'positive' && 'bg-positive/10 text-positive',
                selected && t.tint === 'neutral' && 'bg-sunken text-ink',
              )}
            >
              <Icon size={16} strokeWidth={1.75} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* The guide sheet says all of this in one place, but the question it answers
          arrives here, mid-entry, with the selector already on screen - so the answer
          belongs here too. One line, tied to what's actually selected. */}
      <p className="-mt-space-3 text-caption text-ink-muted">{activeType.guidance}</p>

      <div className="flex flex-col items-center gap-space-2 py-space-2">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Amount</span>
        <AmountInput {...register('amount')} error={errors.amount?.message} valueClassName={amountTintClass} autoFocus />
      </div>

      <div className="rounded-lg border border-line">
        <FormRow label="What for" error={errors.description?.message}>
          <input {...register('description')} autoComplete="off" placeholder="Coffee, rent, groceries…" className={ROW_CONTROL} />
        </FormRow>

        {activeType.needsCategory && (
          <FormRow label="Category" error={errors.categoryId?.message}>
            <CategorySelect
              value={categoryId ?? ''}
              onChange={(v) => setValue('categoryId', v, { shouldValidate: true })}
              categories={pickableCategories}
              income={type === 'INCOME'}
              className="-ml-space-1 max-w-full"
            />
          </FormRow>
        )}

        <FormRow label={activeType.needsDestination ? 'From' : 'Account'} error={errors.accountId?.message}>
          <RowSelect
            value={accountId ?? ''}
            onChange={(v) => v != null && setValue('accountId', v, { shouldValidate: true })}
            options={sourceAccounts}
          />
          {selectedAccount && (
            <span className="mt-space-1 block text-caption text-ink-muted">
              <Amount value={selectedAccount.available} role="caption" /> available
            </span>
          )}
        </FormRow>

        {activeType.needsDestination && (
          <Controller
            control={control}
            name="toAccountId"
            render={({ field }) => (
              <FormRow label="To" error={errors.toAccountId?.message}>
                <RowSelect value={field.value ?? ''} onChange={field.onChange} placeholder="Choose one" options={destinationAccounts} />
                {selectedToAccount && (
                  <span className="mt-space-1 block text-caption text-ink-muted">
                    <Amount value={selectedToAccount.available} role="caption" /> available
                  </span>
                )}
              </FormRow>
            )}
          />
        )}

        <FormRow label="Date">
          <input type="date" {...register('date')} max={todayIso()} className={cn(ROW_CONTROL, 'cursor-pointer')} />
        </FormRow>

        {/* Shown, not hidden behind a disclosure: one row costs nothing, and the note is
            where a correction gets explained - the single most useful field in the
            source workbook's own ledger. */}
        <FormRow label="Note">
          <input {...register('note')} autoComplete="off" placeholder="Optional" className={ROW_CONTROL} />
        </FormRow>
      </div>
    </div>
  );
}
