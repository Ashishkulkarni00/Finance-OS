import { ArrowDownRight, ArrowUpRight, ArrowRightLeft } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { LedgerRow, MetaFacts } from '@/components/LedgerRow';
import { categoryPath } from '@/lib/categoryGroups';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import { cn } from '@/lib/cn';
import type { TransactionResponse, TransactionType } from '@/types/transaction';
import type { CategoryResponse } from '@/types/category';

type Direction = 'in' | 'out' | 'neutral';

export function directionOf(type: TransactionType): Direction {
  if (type === 'INCOME' || type === 'REFUND') return 'in';
  if (type === 'EXPENSE') return 'out';
  return 'neutral';
}

/**
 * One colour per kind of entry, restored 2026-11-10 at the user's request (the v3 revamp had
 * flattened every mark to grey). The colour lives in the leading mark and the figure's sign,
 * as washes - a soft tint, never a full-red amount down the page, so an ordinary month of
 * groceries is legible without reading as forty alarms (rule 8: never judge).
 *
 * <p>Income/refund green, expense red, transfer blue, investment indigo.
 */
const TONE: Record<TransactionType, { mark: string; amount: string; sign: string }> = {
  INCOME: { mark: 'bg-positive-wash text-positive', amount: 'text-positive', sign: 'text-positive' },
  REFUND: { mark: 'bg-positive-wash text-positive', amount: 'text-positive', sign: 'text-positive' },
  EXPENSE: { mark: 'bg-critical-wash text-critical', amount: 'text-ink', sign: 'text-critical' },
  TRANSFER: { mark: 'bg-info-wash text-info', amount: 'text-info', sign: 'text-info' },
  INVESTMENT: { mark: 'bg-info-wash text-invest', amount: 'text-invest', sign: 'text-invest' },
};

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
export function TypeMark({ direction, type }: { direction: Direction; type: TransactionType }) {
  const Icon = direction === 'in' ? ArrowDownRight : direction === 'out' ? ArrowUpRight : ArrowRightLeft;
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md',
        // The arrow's shape says which way the money went; the wash says what kind of entry it is.
        TONE[type].mark,
      )}
    >
      <Icon size={15} strokeWidth={1.5} />
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
function TransactionAmount({ amount, direction, type }: { amount: string; direction: Direction; type: TransactionType }) {
  return (
    <span className="inline-flex items-baseline">
      {direction !== 'neutral' && (
        <span className={cn('num mr-[0.1em]', TONE[type].sign)}>{direction === 'out' ? '−' : '+'}</span>
      )}
      <Amount
        value={amount}
        role="row"
        className={TONE[type].amount}
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
  deleting,
}: {
  transaction: TransactionResponse;
  /** The full category list, so a sub-category can be shown as "Transport · Fuel" -
   *  the transaction's own embedded category summary carries no parent. */
  categories: CategoryResponse[];
  onClick: () => void;
  /** This entry is being deleted (undo window or request in flight). It stays visible - the
   *  server's day totals still include it until the delete is confirmed. */
  deleting?: boolean;
}) {
  const direction = directionOf(transaction.type);
  const isTransfer = transaction.type === 'TRANSFER' || transaction.type === 'INVESTMENT';
  const category = categoryPath(transaction.category, categories);
  const docAnchor = useDocAnchor('ledger.row');
  const categoryDoc = useDocAnchor('ledger.category');
  const accountDoc = useDocAnchor('ledger.account');

  // Most entries get their description from the category they were filed under, so the
  // row was printing the same word three times - as the name, as the line under it, and
  // again as a labelled fact. Each of the two supporting slots now only appears when it
  // says something the name didn't.
  const secondary = transaction.note ?? transaction.merchant ?? undefined;

  const facts = isTransfer
    ? [
        { label: 'From', value: <span {...accountDoc}>{transaction.account.name}</span> },
        { label: 'To', value: <span {...accountDoc}>{transaction.toAccount?.name ?? '—'}</span> },
      ]
    : [
        ...(category && category !== transaction.description
          ? [{ label: 'Category', value: <span {...categoryDoc}>{category}</span> }]
          : []),
        { label: 'Account', value: <span {...accountDoc}>{transaction.account.name}</span> },
      ];

  return (
    // `LedgerRow` doesn't pass through arbitrary props - wrapping it is the same pattern
    // `LoanRow` uses for `loan.card`.
    <div {...docAnchor} aria-busy={deleting || undefined} className={cn('row-wrap', deleting && 'pointer-events-none opacity-50')}>
      <LedgerRow
        onClick={onClick}
        leading={<TypeMark direction={direction} type={transaction.type} />}
        primary={deleting ? <span className="line-through">{transaction.description}</span> : transaction.description}
        // The note is the workbook's own corrections, finally rendered; merchant is the
        // fallback when there's no note. Both were stored and shown nowhere until now.
        secondary={deleting ? 'Deleting…' : secondary === transaction.description ? undefined : secondary}
        meta={<MetaFacts items={facts} />}
        amount={<TransactionAmount amount={transaction.amount} direction={direction} type={transaction.type} />}
        muted={isTransfer}
      />
    </div>
  );
}
