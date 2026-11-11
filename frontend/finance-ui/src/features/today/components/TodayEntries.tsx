import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DayGroup } from '@/features/ledger/components/DayGroup';
import { EditTransactionSheet } from '@/features/ledger/components/EditTransactionSheet';
import { DateRule } from '@/components/DateRule';
import { Skeleton } from '@/components/Skeleton';
import { todayLocalIso } from '@/lib/dates';
import { useAppSelector } from '@/store/hooks';
import { useGetCategoriesQuery } from '@/services/categoryService';
import { useGetDaySubtotalsQuery, useGetTransactionsQuery } from '@/services/transactionService';
import type { TransactionResponse } from '@/types/transaction';

/** Rows shown; one more is fetched so "more in the Ledger" is known without a second request. */
const SHOWN = 5;

/**
 * What today has cost so far - TODAY_HERO_SPEC section 4.4. The Ledger's own day group for
 * today, unchanged, so a row recorded from the Add button lands where the person is looking
 * instead of only in a page they have to open to check.
 *
 * <p>Never hidden when empty: an empty today is the cue to record something, and the header
 * shows where it will land. The day's figures come from the server's `daySubtotals`, never from
 * adding up the rows shown.
 */
export function TodayEntries() {
  const today = todayLocalIso();
  const [editing, setEditing] = useState<TransactionResponse | null>(null);
  const { data: categoriesPage } = useGetCategoriesQuery();
  const { data: page, isLoading } = useGetTransactionsQuery({ dateFrom: today, dateTo: today, size: SHOWN + 1 });
  const { data: subtotals } = useGetDaySubtotalsQuery({ dateFrom: today, dateTo: today });

  // Entries being deleted stay, dimmed, until the server confirms; then they go at once
  // (same handling as the Ledger page, UI_UX_REVAMP_PLAN 6.6).
  const pendingDeletes = useAppSelector((s) => s.ui.pendingDeletes);
  const entries = Object.entries(pendingDeletes);
  const deleting = new Set(entries.filter(([, d]) => d.phase === 'pending' || d.phase === 'sending').map(([id]) => Number(id)));
  const gone = new Set(entries.filter(([, d]) => d.phase === 'deleted').map(([id]) => Number(id)));

  const rows = (page?.content ?? []).filter((r) => !gone.has(r.id));
  const total = page?.totalElements ?? rows.length;

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <section>
      {rows.length === 0 ? (
        <>
          <DateRule day={new Date().getDate()} line1="Today" tone="accent" />
          <p className="pb-space-1 text-caption text-ink-muted">Nothing recorded yet today.</p>
        </>
      ) : (
        <>
          <DayGroup
            date={today}
            transactions={rows.slice(0, SHOWN)}
            subtotal={(subtotals ?? []).find((d) => d.date === today)}
            categories={categoriesPage?.content ?? []}
            onEdit={setEditing}
            deleting={deleting}
            sticky={false}
          />
          <Link to="/ledger" className="mt-space-1 inline-block text-caption text-accent underline-offset-4 hover:underline">
            {total > SHOWN ? `All ${total} in the Ledger →` : 'Open the Ledger →'}
          </Link>
        </>
      )}
      {/* Keyed by id, as on the Ledger page: see the note atop EditTransactionSheet. */}
      <EditTransactionSheet key={editing?.id ?? 'closed'} transaction={editing} onClose={() => setEditing(null)} />
    </section>
  );
}
