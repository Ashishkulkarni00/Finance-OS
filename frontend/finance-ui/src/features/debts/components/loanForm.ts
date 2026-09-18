import { z } from 'zod';

const money = /^\d+(\.\d{1,2})?$/;

/**
 * The fields both loan sheets validate for a loan's terms and where it stands. Cross-field
 * date rules are checked here as well as server-side, so the form can point at the field
 * before anything is sent.
 */
export const loanStateShape = {
  outstanding: z.string().min(1, 'What’s the outstanding principal?').regex(money, 'Enter a valid amount'),
  balanceAsOf: z.string().min(1, 'Which date is that for?'),
  emisRemaining: z
    .string()
    .min(1, 'How many EMIs are left?')
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0, 'A whole number, 0 or more'),
  firstEmiDate: z.string().min(1, 'When is the next EMI?'),
  emi: z
    .string()
    .min(1, "What's the EMI?")
    .regex(money, 'Enter a valid amount')
    .refine((v) => Number(v) > 0, 'Must be more than zero'),
  annualRate: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+(\.\d{1,3})?$/.test(v), 'Enter a valid rate'),
  principal: z
    .string()
    .optional()
    .refine((v) => !v || (money.test(v) && Number(v) > 0), 'Enter a valid amount'),
  tenureMonths: z
    .string()
    .optional()
    .refine((v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 1), 'At least one month'),
  startDate: z.string().optional(),
  originalFirstEmiDate: z.string().optional(),
};

/** ISO dates compare correctly as text. */
export const nextEmiAfterAsOf = {
  check: (v: { firstEmiDate: string; balanceAsOf: string }) => !v.firstEmiDate || !v.balanceAsOf || v.firstEmiDate > v.balanceAsOf,
  params: { message: 'The next EMI has to be after the “As of” date', path: ['firstEmiDate'] },
};

export const firstEmiNotBeforeDisbursal = {
  check: (v: { originalFirstEmiDate?: string; startDate?: string }) =>
    !v.originalFirstEmiDate || !v.startDate || v.originalFirstEmiDate >= v.startDate,
  params: { message: 'The first EMI can’t be before the loan was disbursed', path: ['originalFirstEmiDate'] },
};
