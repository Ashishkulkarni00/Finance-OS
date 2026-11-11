import { useEffect, useState } from 'react';
import { PageHelpButton, PageSubtitle } from '@/features/help/PageHelp';
import { Receipt, Tags, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { useAppSelector } from '@/store/hooks';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { useGetCurrentCycleQuery, useGetCycleQuery } from '@/services/cycleService';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCategoriesQuery } from '@/services/categoryService';
import {
  useGetTransactionsQuery,
  useGetTransactionViewSummaryQuery,
  useGetDaySubtotalsQuery,
} from '@/services/transactionService';
import { useLedgerFilters, toLedgerQuery } from '@/features/ledger/useLedgerFilters';
import { StatedView } from '@/features/ledger/components/StatedView';
import { FilterBar } from '@/features/ledger/components/FilterBar';
import { DayGroup } from '@/features/ledger/components/DayGroup';
import { EditTransactionSheet } from '@/features/ledger/components/EditTransactionSheet';
import { ManageCategoriesSheet } from '@/features/ledger/components/ManageCategoriesSheet';
import type { TransactionResponse } from '@/types/transaction';

const PAGE_SIZE = 50;

/** Groups an already date-descending list into ordered day buckets. Grouping by date is
 *  not money arithmetic, so doing it client-side is fine - the figures attached to each
 *  group still come from the server (`daySubtotals`), never summed here. */
function groupByDay(rows: TransactionResponse[]): { date: string; rows: TransactionResponse[] }[] {
  const groups: { date: string; rows: TransactionResponse[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.date === row.date) {
      last.rows.push(row);
    } else {
      groups.push({ date: row.date, rows: [row] });
    }
  }
  return groups;
}

/**
 * "The Ledger" - the evidence layer behind every derived figure in the product. See
 * docs/product/LEDGER_EXPERIENCE.md and docs/design/LEDGER_UX_SPEC.md.
 *
 * <p>Phase 2 only: the ledger exists and can be linked to (§12 of the product doc).
 * Turning the rest of the product's figures into links here is phase 2, not yet done.
 */
export default function LedgerPage() {
  const { filters, setFilter } = useLedgerFilters();
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [editing, setEditing] = useState<TransactionResponse | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  const { data: currentCycle } = useGetCurrentCycleQuery();
  const explicitCycleId = typeof filters.cycle === 'number' ? filters.cycle : undefined;
  const { data: explicitCycle } = useGetCycleQuery(explicitCycleId ?? 0, { skip: explicitCycleId == null });
  const { data: accountsPage } = useGetAccountsQuery();
  const { data: categoriesPage } = useGetCategoriesQuery();

  const accounts = accountsPage?.content ?? [];
  const categories = categoriesPage?.content ?? [];

  // "This cycle" needs the current cycle's id before it can ask for anything - every
  // query below waits on it rather than firing unscoped and re-firing once it resolves.
  const cycleResolving = filters.cycle === 'current' && !currentCycle;
  const query = toLedgerQuery(filters, currentCycle?.id);

  const {
    data: page,
    isLoading: listLoading,
    isFetching: listFetching,
    isError: listError,
    refetch: refetchList,
  } = useGetTransactionsQuery({ ...query, size: pageSize }, { skip: cycleResolving });

  const { data: summary, isLoading: summaryLoading } = useGetTransactionViewSummaryQuery(query, { skip: cycleResolving });
  const { data: daySubtotals } = useGetDaySubtotalsQuery(query, { skip: cycleResolving });

  // A filter change should start back at the top, not keep whatever "Show older" had
  // already grown the page to.
  useEffect(() => {
    setPageSize(PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.cycle, filters.accountId, filters.categoryId, filters.type, filters.q]);

  // Entries being deleted stay in the list, dimmed, until the server confirms (UI_UX_REVAMP_PLAN 6.6);
  // once it has, they are gone from this list at once, so there is no flash while the refetch lands.
  const pendingDeletes = useAppSelector((s) => s.ui.pendingDeletes);
  const deleting = new Set(
    Object.entries(pendingDeletes)
      .filter(([, d]) => d.phase === 'pending' || d.phase === 'sending')
      .map(([id]) => Number(id)),
  );
  const confirmedGone = new Set(
    Object.entries(pendingDeletes)
      .filter(([, d]) => d.phase === 'deleted')
      .map(([id]) => Number(id)),
  );

  const subtotalByDate = new Map((daySubtotals ?? []).map((d) => [d.date, d]));
  const groups = groupByDay((page?.content ?? []).filter((r) => !confirmedGone.has(r.id)));
  const cycleForSentence = filters.cycle === 'all' ? undefined : filters.cycle === 'current' ? currentCycle : explicitCycle;

  return (
    <div className="reveal-shell flex w-full flex-col gap-space-5 md:gap-space-6">
      <header className="flex flex-col gap-space-1">
        <div className="flex items-center justify-between gap-space-4">
          <h1 className="text-page text-ink">Ledger</h1>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-space-4 gap-y-space-1 max-md:gap-x-space-5">
            <Link
              to="/ledger/import"
              className="flex items-center gap-space-1 text-caption text-accent underline-offset-4 hover:underline"
            >
              <Upload size={14} strokeWidth={1.5} aria-hidden className="max-md:size-[18px]" />
              <span className="max-md:sr-only">Import statement</span>
            </Link>
            <button
              type="button"
              onClick={() => setManagingCategories(true)}
              className="flex items-center gap-space-1 text-caption text-ink-muted transition-colors hover:text-ink-soft"
            >
              <Tags size={14} strokeWidth={1.5} aria-hidden className="max-md:size-[18px]" />
              <span className="max-md:sr-only">Categories</span>
            </button>
            <PageHelpButton topic="spending.how-the-ledger-works" />
          </div>
        </div>
        <PageSubtitle>Every time money actually moved — once each, on the day it moved.</PageSubtitle>
      </header>

      {/* Totals only once the list is narrowed (2026-11-11). Unfiltered, they are the cycle's
          in/out, which Month already shows - the user found the repeat redundant. Narrowed to a
          category, account, type or search, the total is the answer to the question being asked
          and exists nowhere else. */}
      {(filters.accountId != null || filters.categoryId != null || filters.type != null || filters.q) && (
        <StatedView
          filters={filters}
          summary={summary}
          isLoading={summaryLoading || cycleResolving}
          cycle={cycleForSentence}
          accountName={accounts.find((a) => a.id === filters.accountId)?.name}
          categoryName={categories.find((c) => c.id === filters.categoryId)?.name}
        />
      )}

      <FilterBar filters={filters} setFilter={setFilter} accounts={accounts} categories={categories} />

      {listError ? (
        <ErrorState message="We couldn't load the ledger. Check your connection and try again." onRetry={refetchList} />
      ) : listLoading || cycleResolving ? (
        <div className="flex flex-col gap-space-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Receipt}
          headline={
            filters.accountId || filters.categoryId || filters.type || filters.q || filters.cycle !== 'current'
              ? "Nothing matches this view."
              : 'Nothing recorded yet.'
          }
          body={
            filters.accountId || filters.categoryId || filters.type || filters.q
              ? 'Try clearing a filter - it may just be too narrow.'
              : 'Add something and it shows up here, forever.'
          }
          action={
            (filters.accountId || filters.categoryId || filters.type || filters.q) && (
              <Button
                variant="secondary"
                onClick={() => setFilter({ accountId: undefined, categoryId: undefined, type: undefined, q: undefined })}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-space-6">
          {groups.map((g) => (
            <DayGroup
              key={g.date}
              date={g.date}
              transactions={g.rows}
              subtotal={subtotalByDate.get(g.date)}
              categories={categories}
              onEdit={setEditing}
              deleting={deleting}
            />
          ))}

          {page && !page.last && (
            <div className="flex justify-center pt-space-2">
              <Button variant="secondary" disabled={listFetching} onClick={() => setPageSize((s) => s + PAGE_SIZE)}>
                {listFetching ? 'Loading…' : 'Load older'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Keyed by transaction id - see the note atop EditTransactionSheet on why this
          isn't optional: without it, the second row clicked reuses the first row's
          form instance and crashes before its reset effect can catch up. */}
      <EditTransactionSheet key={editing?.id ?? 'closed'} transaction={editing} onClose={() => setEditing(null)} />
      <ManageCategoriesSheet open={managingCategories} onClose={() => setManagingCategories(false)} />
    </div>
  );
}
