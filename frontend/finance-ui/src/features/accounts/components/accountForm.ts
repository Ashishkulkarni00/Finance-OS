import { z } from 'zod';
import { Landmark, Wallet, HandCoins, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
/** The five account kinds a user can actually create - `AccountType` minus `SYSTEM`,
 *  which is a backend-only concept (idempotency bookkeeping etc.) never offered here. */
export type CreatableAccountType = 'BANK' | 'CASH' | 'CREDIT_CARD' | 'LOAN' | 'INVESTMENT';

export const ACCOUNT_TYPES: { value: CreatableAccountType; label: string; icon: LucideIcon }[] = [
  { value: 'BANK', label: 'Bank', icon: Landmark },
  { value: 'CASH', label: 'Cash', icon: Wallet },
  { value: 'LOAN', label: 'Loan', icon: HandCoins },
  { value: 'INVESTMENT', label: 'Investment', icon: TrendingUp },
];

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const accountFormSchema = z.object({
  name: z.string().min(1, "Give the account a name you'll recognise").max(100),
  type: z.enum(['BANK', 'CASH', 'CREDIT_CARD', 'LOAN', 'INVESTMENT']),
  institution: z.string().max(100).optional(),
  lastFour: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}$/.test(v), 'Use the last 4 digits only'),
  // Signed - a card or loan opens already owing money.
  openingBalance: z
    .string()
    .min(1, 'What did it hold on this date?')
    .regex(/^-?\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  openingAsOf: z.string().min(1),
  openingConfidence: z.enum(['CONFIRMED', 'ESTIMATED', 'UNKNOWN']),
  minimumBalance: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), 'Enter a valid amount'),
  minimumBalanceMandatory: z.boolean(),
  /** Whether this bank/cash account's balance counts toward what's free to spend. Only
   *  sent for BANK and CASH - every other type is never spending money, whatever this says. */
  includeInSpendable: z.boolean(),
  purpose: z.string().max(255).optional(),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export const ACCOUNT_FORM_DEFAULTS: AccountFormValues = {
  name: '',
  type: 'BANK',
  institution: '',
  lastFour: '',
  openingBalance: '',
  openingAsOf: todayIso(),
  openingConfidence: 'CONFIRMED',
  minimumBalance: '',
  minimumBalanceMandatory: false,
  includeInSpendable: true,
  purpose: '',
};
