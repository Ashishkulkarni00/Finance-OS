import { useState } from 'react';
import { z } from 'zod';
import { formatShortDate } from '@/lib/dates';

/** The fields "Add a commitment" and "Edit" share. */
export const commitmentSchema = z
  .object({
    name: z.string().min(1, 'What is this commitment?').max(100),
    amountType: z.enum(['FIXED', 'VARIABLE']),
    fixedAmount: z
      .string()
      .optional()
      .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), 'Enter a valid amount'),
    /** ONCE is form-only: saved as a monthly rule that starts and ends in one cycle. */
    frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONCE']),
    dueDay: z
      .string()
      .min(1, 'Which day is it due?')
      // 28, matching the server's @Max - every month has a 28th.
      .refine((v) => Number(v) >= 1 && Number(v) <= 28, 'Pick a day between 1 and 28'),
    accountId: z.number({ error: 'Which account does it leave from?' }),
    /** What happens to the money - see CommitmentFields. */
    settleAs: z.enum(['EXPENSE', 'TRANSFER', 'INVESTMENT', 'INCOME']),
    /** Where it goes, for a transfer or investment. */
    toAccountId: z.number().nullable(),
    categoryId: z.number().nullable(),
    mandatory: z.boolean(),
    why: z.string().max(255).optional(),
    ifSkipped: z.string().max(255).optional(),
  })
  // A fixed commitment without its amount is just a variable one pretending.
  .refine((v) => v.amountType !== 'FIXED' || !!v.fixedAmount, {
    message: 'A fixed commitment needs its amount - or record it as one that varies',
    path: ['fixedAmount'],
  })
  // Money moved or invested has to land somewhere.
  .refine((v) => (v.settleAs !== 'TRANSFER' && v.settleAs !== 'INVESTMENT') || v.toAccountId != null, {
    message: 'Which account does the money go into?',
    path: ['toAccountId'],
  });

export type CommitmentFormValues = z.infer<typeof commitmentSchema>;

/**
 * A one-off plan item is a monthly rule whose window closes within its first month - a
 * Diwali bonus, a cash deposit, a prepayment. (Rules made "once" end on the start cycle's
 * last day; 31 days covers every salary month.)
 */
export function isOneOff(rule: { frequency: string; activeFrom: string; activeTo?: string | null }): boolean {
  if (rule.frequency !== 'MONTHLY' || !rule.activeTo) return false;
  const days = (new Date(rule.activeTo).getTime() - new Date(rule.activeFrom).getTime()) / 86_400_000;
  return days >= 0 && days <= 31;
}

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * The "Last payment" month and year, and the end date they give the bill.
 *
 * <p>The last payment's own due date is the bill's active-to: the server generates an
 * occurrence only while its due date is inside the active window, so this ends the bill
 * exactly after that payment, whatever the salary cycle boundaries are.
 *
 * @param dueDay         the due day as entered
 * @param firstDue       the first payment's date, for "can't end before it starts"
 * @param initialActiveTo a saved end date, when editing
 */
export function useLastPayment(dueDay: number, firstDue: string | null, initialActiveTo: string | null = null) {
  const [endMonth, setEndMonth] = useState(initialActiveTo ? initialActiveTo.slice(5, 7) : '');
  const [endYear, setEndYear] = useState(initialActiveTo ? initialActiveTo.slice(0, 4) : '');

  const validDueDay = Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= 28;
  // ISO strings compare correctly as text.
  const lastDue = endMonth && endYear && validDueDay ? `${endYear}-${endMonth}-${String(dueDay).padStart(2, '0')}` : null;
  const error =
    (endMonth || endYear) && !(endMonth && endYear)
      ? 'Choose both the month and the year'
      : endMonth && endYear && !validDueDay
        ? 'Enter the due day first'
        : lastDue && firstDue && lastDue < firstDue
          ? `The last payment can’t be before the first one (${formatShortDate(firstDue)})`
          : null;

  const thisYear = new Date().getFullYear();
  const fromYear = Math.min(
    firstDue ? Number(firstDue.slice(0, 4)) : thisYear,
    initialActiveTo ? Number(initialActiveTo.slice(0, 4)) : thisYear,
    thisYear,
  );
  const yearOptions = Array.from({ length: 36 }, (_, i) => String(fromYear + i)).map((y) => ({ value: y, label: y }));

  const clear = () => {
    setEndMonth('');
    setEndYear('');
  };

  return { endMonth, setEndMonth, endYear, setEndYear, lastDue, error, yearOptions, clear };
}

export type LastPayment = ReturnType<typeof useLastPayment>;
