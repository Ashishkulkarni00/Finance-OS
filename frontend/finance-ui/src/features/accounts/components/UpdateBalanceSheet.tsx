import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { Amount } from '@/components/Amount';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { useUpdateAccountMutation } from '@/services/accountService';
import { handleEnterAdvance } from '@/lib/formKeyboard';
import { formatShortDate, todayLocalIso } from '@/lib/dates';
import type { AccountResponse, BalanceConfidence } from '@/types/api';

const CONFIDENCE_OPTIONS: { value: BalanceConfidence; label: string }[] = [
  { value: 'CONFIRMED', label: 'Confirmed - read off the bank' },
  { value: 'ESTIMATED', label: 'Estimated - a considered figure' },
  { value: 'UNKNOWN', label: "Unknown - I'm not sure" },
];

const schema = z.object({
  // Signed. On a card or loan this is what's owed; negative means in credit.
  balance: z
    .string()
    .min(1, 'What does it hold right now?')
    .regex(/^-?\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  asOf: z.string().min(1, 'Which day is this balance true for?'),
  confidence: z.enum(['CONFIRMED', 'ESTIMATED', 'UNKNOWN']),
});

type FormValues = z.infer<typeof schema>;

/** Flips the sign of a decimal string without arithmetic: "12000" -> "-12000", "-500" -> "500",
 *  and zero stays unsigned. */
function flipSign(value: string): string {
  if (value.startsWith('-')) return value.slice(1);
  return /^0+(\.0+)?$/.test(value) ? value : `-${value}`;
}

interface UpdateBalanceSheetProps {
  account: AccountResponse;
  open: boolean;
  onClose: () => void;
}

/**
 * "Update balance" - reset an account to what it actually holds, as the bank shows it.
 *
 * <p>Implemented as a re-anchor, not an adjustment entry: the account's opening balance
 * becomes the figure entered and its as-of date becomes the day it's true for (ADR-0009).
 * From then on, balance = that figure + entries dated <em>after</em> that day. So
 * everything recorded up to and including that day is treated as already inside the
 * figure - which is what "the bank says it's ₹X now" means - and nothing is counted twice.
 *
 * <p>Deliberately not an adjusting transaction ("balance correction ₹-1,240"): that would
 * appear as spending or income in the month it was entered, and a reset is neither.
 *
 * <p>The date defaults to today and can't be in the future - the server rejects a
 * balance claimed to be true on a day that hasn't happened.
 */
export function UpdateBalanceSheet({ account, open, onClose }: UpdateBalanceSheetProps) {
  const [updateAccount, { isLoading }] = useUpdateAccountMutation();
  // A card or loan stores what's owed as a negative balance. The form asks for the owed
  // figure as the statement prints it (positive) and flips the sign before sending, as
  // Add a credit card does - a positive figure must never read as money in hand.
  const owes = account.type === 'CREDIT_CARD' || account.type === 'LOAN';
  const shownOwed = owes ? flipSign(account.currentBalance) : null;
  const today = todayLocalIso();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { balance: '', asOf: today, confidence: 'CONFIRMED' },
  });

  const asOf = watch('asOf');

  const close = () => {
    onClose();
    reset({ balance: '', asOf: today, confidence: 'CONFIRMED' });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await updateAccount({
        id: account.id,
        body: {
          openingBalance: owes ? flipSign(values.balance) : values.balance,
          openingAsOf: values.asOf,
          openingConfidence: values.confidence,
        },
      }).unwrap();
      close();
    } catch (err) {
      const appError = err as { message?: string; field?: string };
      setError(appError.field === 'openingAsOf' ? 'asOf' : 'balance', {
        message: appError.message ?? "Couldn't update the balance. Try again.",
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Update ${account.name} balance`}
      footer={
        <Button type="submit" form="update-balance" variant="primary" disabled={isLoading} className="w-full">
          Update balance
        </Button>
      }
    >
      <form id="update-balance" onSubmit={handleSubmit(onSubmit)} onKeyDown={handleEnterAdvance} autoComplete="off" className="flex flex-col gap-space-5">
        {shownOwed != null ? (
          <p className="text-body text-ink-soft">
            Kosh currently shows{' '}
            <Amount value={shownOwed.startsWith('-') ? flipSign(shownOwed) : shownOwed} role="body" className="text-ink" />{' '}
            {shownOwed.startsWith('-') ? 'in credit' : 'owed'} on this account. Enter what your statement or app shows you owe now.
          </p>
        ) : (
          <p className="text-body text-ink-soft">
            Kosh currently shows <Amount value={account.currentBalance} role="body" className="text-ink" emphasiseNegative /> for
            this account. Enter what your bank shows instead.
          </p>
        )}

        <div className="rounded-lg border border-line">
          <FormRow
            label={owes ? 'Owed now' : 'Balance now'}
            error={errors.balance?.message}
            hint={owes ? 'The total you owe today as a positive amount; enter a negative amount only if the account is in credit.' : undefined}
          >
            <span className="flex items-center gap-space-1">
              <span className="num text-ink-muted">₹</span>
              <input
                {...register('balance')}
                inputMode="decimal"
                autoFocus
                placeholder={owes ? 'e.g. 12000' : '0'}
                className={FORM_ROW_CONTROL + ' num'}
              />
            </span>
          </FormRow>

          <FormRow label="True as of" error={errors.asOf?.message}>
            <input type="date" {...register('asOf')} max={today} className={FORM_ROW_CONTROL + ' cursor-pointer'} />
          </FormRow>

          <FormRow label="How sure?">
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="How sure are you of this balance"
              value={watch('confidence')}
              options={CONFIDENCE_OPTIONS}
              onChange={(v) => setValue('confidence', v as BalanceConfidence, { shouldValidate: true })}
            />
          </FormRow>
        </div>

        {asOf && (
          <div className="flex flex-col gap-space-2 rounded-lg bg-sunken px-space-4 py-space-3 text-caption text-ink-soft">
            <p>
              After this, the balance is exactly what you enter, as of{' '}
              <strong className="font-medium text-ink">{formatShortDate(asOf)}</strong>. Entries dated on or before{' '}
              {formatShortDate(asOf)} are treated as already included; only entries after it are added.
            </p>
            <p>
              Do this as the last thing on {formatShortDate(asOf)} — an entry you add afterwards with the same date won’t
              be counted.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}
