import { useEffect, useState } from 'react';
import { Receipt, CircleHelp, Tags, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
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
import { LedgerGuideSheet } from '@/features/ledger/components/LedgerGuideSheet';
import { LedgerPrimer } from '@/features/ledger/components/LedgerPrimer';
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
 * <p>Phase 1 only: the ledger exists and can be linked to (§12 of the product doc).
 * Turning the rest of the product's figures into links here is phase 2, not yet done.
 */
export default function LedgerPage() {
  const { filters, setFilter } = useLedgerFilters();
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [editing, setEditing] = useState<TransactionResponse | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
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

  const subtotalByDate = new Map((daySubtotals ?? []).map((d) => [d.date, d]));
  const groups = groupByDay(page?.content ?? []);
  const cycleForSentence = filters.cycle === 'all' ? undefined : filters.cycle === 'current' ? currentCycle : explicitCycle;

  return (
    <div className="flex flex-col gap-space-6">
      <div className="flex items-start justify-between gap-space-4">
        <StatedView
          filters={filters}
          summary={summary}
          isLoading={summaryLoading || cycleResolving}
          cycle={cycleForSentence}
          accountName={accounts.find((a) => a.id === filters.accountId)?.name}
          categoryName={categories.find((c) => c.id === filters.categoryId)?.name}
        />
        <div className="flex shrink-0 items-center gap-space-4">
          <Link
            to="/ledger/import"
            className="flex items-center gap-space-1 text-caption text-accent underline-offset-4 hover:underline"
          >
            <Upload size={14} strokeWidth={1.5} aria-hidden />
            Import statement
          </Link>
          <button
            type="button"
            onClick={() => setManagingCategories(true)}
            className="flex items-center gap-space-1 text-caption text-ink-muted transition-colors hover:text-ink-soft"
          >
            <Tags size={14} strokeWidth={1.5} aria-hidden />
            Manage categories
          </button>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="flex items-center gap-space-1 text-caption text-ink-muted transition-colors hover:text-ink-soft"
          >
            <CircleHelp size={14} strokeWidth={1.5} aria-hidden />
            What goes here?
          </button>
        </div>
      </div>

      <LedgerPrimer onOpenGuide={() => setGuideOpen(true)} />

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
            />
          ))}

          {page && !page.last && (
            <div className="flex justify-center pt-space-2">
              <Button variant="secondary" disabled={listFetching} onClick={() => setPageSize((s) => s + PAGE_SIZE)}>
                {listFetching ? 'Loading…' : 'Show older'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Keyed by transaction id - see the note atop EditTransactionSheet on why this
          isn't optional: without it, the second row clicked reuses the first row's
          form instance and crashes before its reset effect can catch up. */}
      <EditTransactionSheet key={editing?.id ?? 'closed'} transaction={editing} onClose={() => setEditing(null)} />
      <LedgerGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
      <ManageCategoriesSheet open={managingCategories} onClose={() => setManagingCategories(false)} />
    </div>
  );
}
