import { Controller } from 'react-hook-form';
import { useAppSelector } from '@/store/hooks';
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Amount } from '@/components/Amount';
import { Select } from '@/components/Select';
import { FormRow, FORM_ROW_CONTROL as ROW_CONTROL } from '@/components/FormRow';
import { AmountInput } from './AmountInput';
import { AffordNote } from './AffordNote';
import { CategorySelect } from './CategorySelect';
import {
  TRANSACTION_TYPES,
  activeTransactionType,
  eligibleSourceAccounts,
  eligibleDestinationAccounts,
  eligibleCategories,
  type TransactionFormValues,
} from './transactionForm';
import { cn } from '@/lib/cn';
import { shiftIsoDays, todayLocalIso } from '@/lib/dates';
import { lastAccountFor, recentCategoriesFor } from '../addMemory';
import type { AccountResponse } from '@/types/api';
import type { CategoryResponse } from '@/types/category';
import type { CommitmentInstanceResponse } from '@/types/commitment';
import { formatMoney } from '@/lib/money';

interface TransactionFormFieldsProps {
  register: UseFormRegister<TransactionFormValues>;
  control: Control<TransactionFormValues>;
  watch: UseFormWatch<TransactionFormValues>;
  setValue: UseFormSetValue<TransactionFormValues>;
  errors: FieldErrors<TransactionFormValues>;
  accounts: AccountResponse[];
  categories: CategoryResponse[];
  /** Open bills this entry could go towards - already filtered to the chosen account and
   *  the matching settle type. Empty hides the row entirely. */
  settleable?: CommitmentInstanceResponse[];
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
  /** `hint` is the right-aligned qualifier - "₹2,500 left". Optional. */
  options: { id: number; name: string; hint?: string }[];
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
      options={options.map((o) => ({ value: String(o.id), label: o.name, hint: o.hint }))}
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
/**
 * "₹40,926 available · ₹10,000 held back as a minimum balance" under a chosen account.
 *
 * <p>The bare figure prompted the question it was meant to answer. The user picked HDFC
 * Salary, saw "₹40,926 available" against a balance of ₹50,926, and asked what the number
 * had been through - which is the whole complaint about unexplained figures, on a form where
 * the gap decides whether a transfer goes through.
 *
 * <p>Says what is held and why, because the two reasons behave differently: a mandatory
 * minimum is the bank's rule, a reservation is the user's own. When both exist the larger
 * wins (`locked = max(reserved, minimumHold)`, never the sum - money inside the minimum is
 * already held by it), so only the one actually doing the work is named. Nothing held back
 * means nothing to explain, and the figure stands alone as before.
 */
function AvailableNote({ account }: { account: AccountResponse }) {
  const locked = account.hold?.locked;
  const held = locked != null && Number(locked) > 0;
  const byMinimum = held && account.hold != null && Number(account.hold.minimumHold) >= Number(account.hold.reserved);
  const reasons = account.hold?.reservedFor ?? [];
  return (
    <span className="mt-space-1 block text-caption text-ink-muted">
      <Amount value={account.available} role="caption" /> available
      {held && (
        <>
          {' · '}
          <Amount value={locked} role="caption" /> held back
          {byMinimum
            ? ' as a minimum balance'
            : reasons.length > 0
              ? ` for ${reasons.join(', ')}`
              : ' as a reservation'}
        </>
      )}
    </span>
  );
}

export function TransactionFormFields({ register, control, watch, setValue, errors, accounts, categories, settleable = [] }: TransactionFormFieldsProps) {
  // While the server is unreachable an affordability answer would come from stale data - a guess
  // dressed as a check - so it is not asked (UI_UX_REVAMP_PLAN 6.11).
  const offline = useAppSelector((s) => s.connectivity.offline);
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
    // The account last used for this kind of entry, if it is still a valid choice; otherwise keep
    // the current one when it is valid for the new type, else the first valid account. Never an
    // invalid one - the picker always shows something the server will accept.
    const eligible = eligibleSourceAccounts(next, accounts);
    const remembered = lastAccountFor(next);
    const currentOk = accountId != null && eligible.some((a) => a.id === accountId);
    const target =
      remembered != null && eligible.some((a) => a.id === remembered) ? remembered : currentOk ? accountId : eligible[0]?.id;
    if (target != null && target !== accountId) setValue('accountId', target, { shouldValidate: true });
    else if (target == null) setValue('accountId', undefined as unknown as number);
    if (toAccountId != null && !eligibleDestinationAccounts(next, accounts).some((a) => a.id === toAccountId)) {
      setValue('toAccountId', null);
    }
    if (categoryId != null && !eligibleCategories(next, categories).some((c) => c.id === categoryId)) {
      setValue('categoryId', null);
    }
  };

  // Direction is said by the type and the label, never by colour: expenses are not red and income is not
  // green (DESIGN_SYSTEM 4, rule 3).
  const amountTintClass = 'text-ink';

  // Recently used categories for this kind of entry, newest first, limited to ones still pickable.
  const recentCategories = recentCategoriesFor(type)
    .map((id) => pickableCategories.find((c) => c.id === id))
    .filter((c): c is CategoryResponse => c != null);
  const date = watch('date');
  const today = todayLocalIso();
  const yesterday = shiftIsoDays(today, -1);
  const customDate = date !== today && date !== yesterday;

  return (
    <div className="flex w-full flex-col gap-space-5">
      <div role="group" aria-label="What are you recording?" className="flex rounded-lg bg-sunken p-[2px]">
        {/* Investment is not offered for a new entry (2026-11-11, the user): an SIP or RD
            instalment is recorded from its commitment ("Record it"), which already files it as
            invested and links it to the plan. It still shows when the entry being edited *is*
            one, so an existing investment can be opened and changed. */}
        {TRANSACTION_TYPES.filter((t) => t.value !== 'INVESTMENT' || type === 'INVESTMENT').map((t) => {
          const selected = type === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => selectType(t.value)}
              aria-pressed={selected}
              className={cn(
                'flex h-8 flex-1 items-center justify-center rounded-[6px] text-label transition-colors duration-150 pointer-coarse:h-10',
                selected
                  ? 'bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--line)]'
                  : 'font-normal text-ink-muted hover:text-ink-soft',
              )}
            >
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
        <span className="text-caption text-ink-muted">Amount</span>
        <AmountInput {...register('amount')} error={errors.amount?.message} valueClassName={amountTintClass} autoFocus />
        {/* What this would cost, while it is still being typed (ROADMAP 4.2). Only for
            money actually leaving: a transfer moves money between accounts the user owns
            and an income does not spend anything, so neither has a consequence to state -
            and a line that appears on all five types would stop being read on the one
            where it matters. */}
        {activeType.tint === 'critical' && !offline && <AffordNote amount={watch('amount')} accountId={accountId} />}
      </div>

      <div className="rounded-lg border border-line">
        <FormRow label={activeType.words.description} error={errors.description?.message}>
          <input {...register('description')} autoComplete="off" placeholder={activeType.words.placeholder} className={ROW_CONTROL} />
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
            {/* The categories used last time, one tap each - the fastest way to log a repeat
                spend. Only ones still pickable for this kind of entry; hidden when there are none. */}
            {recentCategories.length > 0 && (
              <div className="mt-space-2 flex flex-wrap gap-space-1" role="group" aria-label="Recently used categories">
                {recentCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setValue('categoryId', c.id, { shouldValidate: true, shouldDirty: true })}
                    aria-pressed={categoryId === c.id}
                    className={cn(
                      'h-7 rounded-full border px-space-3 text-caption transition-colors duration-150 pointer-coarse:h-9',
                      categoryId === c.id
                        ? 'border-accent bg-accent-wash text-ink'
                        : 'border-border text-ink-soft hover:border-ink-muted hover:text-ink',
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </FormRow>
        )}

        <FormRow label={activeType.words.account} error={errors.accountId?.message}>
          <RowSelect
            value={accountId ?? ''}
            onChange={(v) => v != null && setValue('accountId', v, { shouldValidate: true })}
            options={sourceAccounts}
          />
          {selectedAccount && <AvailableNote account={selectedAccount} />}
        </FormRow>

        {activeType.needsDestination && (
          <Controller
            control={control}
            name="toAccountId"
            render={({ field }) => (
              <FormRow label={activeType.words.to ?? 'To'} error={errors.toAccountId?.message}>
                <RowSelect value={field.value ?? ''} onChange={field.onChange} placeholder="Choose one" options={destinationAccounts} />
                {selectedToAccount && <AvailableNote account={selectedToAccount} />}
              </FormRow>
            )}
          />
        )}

        {/* Only when there is actually an open bill this could pay - a row offering nothing
            is worse than no row. Sits after the account because the list depends on it. */}
        {settleable.length > 0 && (
          <Controller
            control={control}
            name="settlesInstanceId"
            render={({ field }) => {
              // Not a warning any more - a bill may be settled from any account, and the
              // row records where the money actually came from. This just names the plan,
              // so choosing a bill that usually leaves another account is a deliberate act
              // rather than a surprise on Months later.
              const chosen = settleable.find((i) => i.id === field.value);
              const mismatch = chosen && chosen.account.id !== accountId ? chosen.account.name : null;
              return (
              <FormRow
                label="Towards a bill?"
                hint={
                  mismatch
                    ? `Marks that bill part-paid by this entry. It is usually paid from ${mismatch}; paying it from here is fine, and the bill will show where the money actually came from.`
                    : 'Marks that bill part-paid by this entry. Leave it as day-to-day spending if it isn’t one of them.'
                }
              >
                <RowSelect
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v ?? null)}
                  placeholder="No — day-to-day spending"
                  options={settleable.map((i) => ({
                    id: i.id,
                    name: i.commitmentName,
                    // What is still owed, so a part payment is an obvious thing to make.
                    hint: i.outstanding != null ? `${formatMoney(i.outstanding)} left` : undefined,
                  }))}
                />
              </FormRow>
              );
            }}
          />
        )}

        <FormRow label="Date">
          {/* Today and yesterday cover almost every entry; anything else opens the native picker
              (accessible, localised, free). The date is the user's own local day, never UTC. */}
          <div className="flex flex-wrap items-center gap-space-1">
            {[
              { label: 'Today', iso: today },
              { label: 'Yesterday', iso: yesterday },
            ].map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setValue('date', d.iso, { shouldValidate: true, shouldDirty: true })}
                aria-pressed={date === d.iso}
                className={cn(
                  'h-7 rounded-full border px-space-3 text-caption transition-colors duration-150 pointer-coarse:h-9',
                  date === d.iso ? 'border-accent bg-accent-wash text-ink' : 'border-border text-ink-soft hover:border-ink-muted hover:text-ink',
                )}
              >
                {d.label}
              </button>
            ))}
            <input
              type="date"
              {...register('date')}
              max={today}
              aria-label="Pick another date"
              className={cn(
                'h-7 cursor-pointer rounded-full border bg-transparent px-space-3 text-caption outline-none transition-colors duration-150 pointer-coarse:h-9',
                customDate ? 'border-accent bg-accent-wash text-ink' : 'border-border text-ink-soft hover:border-ink-muted',
              )}
            />
          </div>
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
