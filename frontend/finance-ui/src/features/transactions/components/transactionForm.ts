import { z } from 'zod';
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, TrendingUp, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TransactionResponse, TransactionType } from '@/types/transaction';
import type { AccountResponse, AccountType } from '@/types/api';
import type { CategoryResponse } from '@/types/category';

/**
 * One shared definition of "what a transaction type means for this form" - which
 * fields it needs, its label, its icon. `AddSheet` and `EditTransactionSheet` used to
 * carry two copies of this (and of the validation schema below); the two had already
 * drifted once (different required-field behaviour) before either had a UI worth
 * looking at. One definition means they can't drift again.
 */
/** Restrained, not loud: only the two directions that are genuinely opposite (money in
 *  vs money out) get a hue. Transfer and Investment share the same neutral treatment as
 *  they do on the Ledger row - visibly a third, different kind of thing, not a colour of
 *  their own (LEDGER_IMPROVEMENT_PLAN §2 P4, and the same rule TransactionRow already
 *  applies when viewing - this is the same language while entering). */
export type TypeTint = 'positive' | 'critical' | 'neutral';

export const TRANSACTION_TYPES: {
  value: TransactionType;
  label: string;
  icon: LucideIcon;
  needsCategory: boolean;
  needsDestination: boolean;
  tint: TypeTint;
  /**
   * One sentence, shown under the type selector while that type is chosen.
   *
   * <p>The guide sheet explains all five in one place, but nobody opens a help sheet
   * mid-entry - the moment the question "is this an expense or a transfer?" actually
   * arises is the moment the selector is already on screen. Phrased as what the money
   * *did*, with the one case people get wrong named explicitly.
   */
  guidance: string;
}[] = [
  {
    value: 'EXPENSE',
    label: 'Expense',
    icon: ArrowUpRight,
    needsCategory: true,
    needsDestination: false,
    tint: 'critical',
    guidance: 'Money that left you for good. A card swipe goes here on the day you swiped it - not when the bill is paid.',
  },
  {
    value: 'INCOME',
    label: 'Income',
    icon: ArrowDownRight,
    needsCategory: true,
    needsDestination: false,
    tint: 'positive',
    guidance: 'Money that arrived from outside - salary, a client, interest. Not money you moved between your own accounts.',
  },
  {
    value: 'TRANSFER',
    label: 'Transfer',
    icon: ArrowRightLeft,
    needsCategory: false,
    needsDestination: true,
    tint: 'neutral',
    guidance: 'Money moving between accounts you already own: paying a card bill, taking out cash, paying down a loan. Never spending.',
  },
  {
    value: 'INVESTMENT',
    label: 'Investment',
    icon: TrendingUp,
    needsCategory: false,
    needsDestination: true,
    tint: 'neutral',
    guidance: 'Money moving into something you still hold - a SIP instalment, an RD. You keep it, so it is not spending.',
  },
  {
    value: 'REFUND',
    label: 'Refund',
    icon: RotateCcw,
    needsCategory: true,
    needsDestination: false,
    tint: 'positive',
    guidance: 'Money coming back against something you already spent on. It uses the spending category it reverses, not an income one.',
  },
];

export const transactionFormSchema = z
  .object({
    amount: z
      .string()
      .min(1, 'Enter an amount')
      .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount')
      .refine((v) => Number(v) > 0, 'Amount must be more than zero'),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'INVESTMENT', 'REFUND']),
    accountId: z.number({ error: 'Choose an account' }),
    toAccountId: z.number().nullable(),
    categoryId: z.number().nullable(),
    description: z.string().min(1, 'Add a short description').max(200),
    date: z.string().min(1),
    note: z.string().max(500).optional(),
  })
  .refine((v) => !TRANSACTION_TYPES.find((t) => t.value === v.type)?.needsDestination || v.toAccountId != null, {
    message: 'Choose a destination account',
    path: ['toAccountId'],
  })
  .refine((v) => v.accountId !== v.toAccountId, {
    message: "Money can't move from an account to itself",
    path: ['toAccountId'],
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Seeds the form from an existing row - `EditTransactionSheet`'s starting point. */
export function transactionToFormValues(t: TransactionResponse): TransactionFormValues {
  return {
    amount: t.amount,
    type: t.type,
    accountId: t.account.id,
    toAccountId: t.toAccount?.id ?? null,
    categoryId: t.category?.id ?? null,
    description: t.description,
    date: t.date,
    note: t.note ?? '',
  };
}

/** Falls back to the first type rather than a non-null assertion - cheap insurance
 *  against ever crashing on an unrecognised `type` value instead of a hard TypeError
 *  mid-render (this is exactly how the edit sheet crashed once already). */
export function activeTransactionType(type: TransactionType | undefined) {
  return TRANSACTION_TYPES.find((t) => t.value === type) ?? TRANSACTION_TYPES[0]!;
}

/**
 * The client-side mirror of `TransactionType.acceptsSource`/`acceptsDestination` on the
 * backend (`TransactionType.java`). Filtering the pickers here is what stops the error
 * from firing at all in the common case - a loan account simply never appears as
 * something to spend from, rather than being offered and then rejected on submit.
 *
 * <p>Mirrored, not shared: the backend is still the authority and revalidates on every
 * write regardless of what this filters out, which is what makes it safe for the two
 * to describe the same rule twice (LEDGER_IMPROVEMENT_PLAN §2 P1).
 */
const SOURCE_ELIGIBLE: Record<TransactionType, AccountType[]> = {
  EXPENSE: ['BANK', 'CASH', 'CREDIT_CARD'],
  INCOME: ['BANK', 'CASH'],
  REFUND: ['BANK', 'CASH', 'CREDIT_CARD'],
  TRANSFER: ['BANK', 'CASH'],
  INVESTMENT: ['BANK', 'CASH'],
};

const DESTINATION_ELIGIBLE: Record<TransactionType, AccountType[]> = {
  EXPENSE: [],
  INCOME: [],
  REFUND: [],
  TRANSFER: ['BANK', 'CASH', 'CREDIT_CARD', 'LOAN', 'INVESTMENT'],
  INVESTMENT: ['INVESTMENT'],
};

export function eligibleSourceAccounts(type: TransactionType, accounts: AccountResponse[]): AccountResponse[] {
  return accounts.filter((a) => SOURCE_ELIGIBLE[type].includes(a.type));
}

export function eligibleDestinationAccounts(type: TransactionType, accounts: AccountResponse[]): AccountResponse[] {
  return accounts.filter((a) => DESTINATION_ELIGIBLE[type].includes(a.type));
}

/** REFUND deliberately takes expense-side categories, not income ones - a returned
 *  shirt is negative Shopping, not income (`CategoryGroup.java`'s own reasoning). */
export function eligibleCategories(type: TransactionType, categories: CategoryResponse[]): CategoryResponse[] {
  return type === 'INCOME' ? categories.filter((c) => c.group === 'INCOME') : categories.filter((c) => c.group !== 'INCOME');
}
