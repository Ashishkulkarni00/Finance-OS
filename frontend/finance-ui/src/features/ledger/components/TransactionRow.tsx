import { ArrowDownRight, ArrowUpRight, ArrowRightLeft } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { LedgerRow, MetaFacts } from '@/components/LedgerRow';
import { categoryPath } from '@/lib/categoryGroups';
import { cn } from '@/lib/cn';
import type { TransactionResponse, TransactionType } from '@/types/transaction';
import type { CategoryResponse } from '@/types/category';

type Direction = 'in' | 'out' | 'neutral';

function directionOf(type: TransactionType): Direction {
  if (type === 'INCOME' || type === 'REFUND') return 'in';
  if (type === 'EXPENSE') return 'out';
  return 'neutral';
}

/**
 * The type mark in the leading slot - the same tinted-wash treatment the Add/Edit form's
 * type selector uses for the type being recorded, so the colour that means "expense"
 * while you are typing means "expense" when you read it back.
 *
 * <p>The wash is where the colour lives, not the figure. A ledger is overwhelmingly
 * expenses; setting every one of those amounts in full red would leave a page of forty
 * alarms for forty ordinary groceries, and red on routine spending reads as a verdict
 * (rule 8 - never judge the user). Income is the exception and stays fully green: it is
 * rare enough to be worth spotting, and it is unambiguously good news.
 *
 * <p>TRANSFER/INVESTMENT get a distinct ↔ glyph in a neutral tone - visibly a different
 * *kind* of row, not spending in either direction. LEDGER_UX_SPEC.md §4.
 */
function TypeMark({ direction }: { direction: Direction }) {
  const Icon = direction === 'in' ? ArrowDownRight : direction === 'out' ? ArrowUpRight : ArrowRightLeft;
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md',
        direction === 'in' && 'bg-positive/10 text-positive',
        direction === 'out' && 'bg-critical/10 text-critical',
        direction === 'neutral' && 'bg-sunken text-ink-muted',
      )}
    >
      <Icon size={15} strokeWidth={1.75} />
    </span>
  );
}

/**
 * The signed figure. The stored amount is always positive - direction lives in the
 * type - so the sign shown here is notation the row adds for reading, never arithmetic
 * on the value itself (the same licence `StatementRow`'s `deduct` already takes).
 * Transfers carry no sign at all: they are not a gain or a loss.
 *
 * <p>The sign carries the colour on an expense, the whole figure on income - see the
 * note on `TypeMark` for why those are treated differently.
 */
function TransactionAmount({ amount, direction }: { amount: string; direction: Direction }) {
  return (
    <span className="inline-flex items-baseline">
      {direction !== 'neutral' && (
        <span className={cn('num mr-[0.1em]', direction === 'out' ? 'text-critical' : 'text-positive')}>
          {direction === 'out' ? '−' : '+'}
        </span>
      )}
      <Amount
        value={amount}
        role="row"
        className={direction === 'in' ? 'text-positive' : direction === 'neutral' ? 'text-ink-muted' : 'text-ink'}
      />
    </span>
  );
}

/**
 * One row of the Ledger - opens the edit sheet on click (D3: inline edit, not a
 * separate detail route). Built on the shared `LedgerRow` grid, same as Month and
 * Accounts, so the eye never has to re-learn a layout switching between screens.
 */
export function TransactionRow({
  transaction,
  categories,
  onClick,
}: {
  transaction: TransactionResponse;
  /** The full category list, so a sub-category can be shown as "Transport · Fuel" -
   *  the transaction's own embedded category summary carries no parent. */
  categories: CategoryResponse[];
  onClick: () => void;
}) {
  const direction = directionOf(transaction.type);
  const isTransfer = transaction.type === 'TRANSFER' || transaction.type === 'INVESTMENT';
  const category = categoryPath(transaction.category, categories);

  // Most entries get their description from the category they were filed under, so the
  // row was printing the same word three times - as the name, as the line under it, and
  // again as a labelled fact. Each of the two supporting slots now only appears when it
  // says something the name didn't.
  const secondary = transaction.note ?? transaction.merchant ?? undefined;

  const facts = isTransfer
    ? [
        { label: 'From', value: transaction.account.name },
        { label: 'To', value: transaction.toAccount?.name ?? '—' },
      ]
    : [
        ...(category && category !== transaction.description ? [{ label: 'Category', value: category }] : []),
        { label: 'Account', value: transaction.account.name },
      ];

  return (
    <LedgerRow
      onClick={onClick}
      leading={<TypeMark direction={direction} />}
      primary={transaction.description}
      // The note is the workbook's own corrections, finally rendered; merchant is the
      // fallback when there's no note. Both were stored and shown nowhere until now.
      secondary={secondary === transaction.description ? undefined : secondary}
      meta={<MetaFacts items={facts} />}
      amount={<TransactionAmount amount={transaction.amount} direction={direction} />}
      muted={isTransfer}
    />
  );
}
