import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/components/Button';
import { Amount } from '@/components/Amount';
import { Select } from '@/components/Select';
import { SectionHeader } from '@/components/SectionHeader';
import { CategorySelect } from '@/features/transactions/components/CategorySelect';
import { formatShortDate } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCategoriesQuery } from '@/services/categoryService';
import { useCommitImportMutation, useUpdateImportRowMutation, useUploadStatementMutation } from '@/services/importService';
import type { ImportBatchResponse, ImportRowResponse, ImportRowType } from '@/types/import';

const KIND_OPTIONS: { value: ImportRowType; label: string }[] = [
  { value: 'EXPENSE', label: 'Spent' },
  { value: 'INCOME', label: 'Came in' },
  { value: 'TRANSFER', label: 'Moved to my account' },
];

/**
 * Import a bank or card statement (STRATEGY_DEEP_DIVE Phase 1 piece 5): the biggest single
 * cut in typing. Choose the account and the CSV the bank gives you → check the rows → import.
 *
 * <p>Nothing is imported until the user presses Import, and nothing is imported unseen:
 * possible duplicates are left out unless ticked, lines that couldn't be read are shown
 * with the reason, and categories pre-filled from past entries are visible and changeable.
 * Imported entries match planned bills exactly like entries typed in the Ledger.
 */
export default function ImportPage() {
  const navigate = useNavigate();
  const { data: accountsPage } = useGetAccountsQuery();
  const { data: categoriesPage } = useGetCategoriesQuery();
  const [upload, { isLoading: uploading }] = useUploadStatementMutation();
  const [updateRow] = useUpdateImportRowMutation();
  const [commit, { isLoading: committing }] = useCommitImportMutation();

  const [accountId, setAccountId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<ImportBatchResponse | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [includedDuplicates, setIncludedDuplicates] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const accounts = (accountsPage?.content ?? []).filter((a) => !a.archived && ['BANK', 'CASH', 'CREDIT_CARD'].includes(a.type));
  const transferTargets = (accountsPage?.content ?? []).filter((a) => !a.archived && a.id !== accountId);
  const categories = (categoriesPage?.content ?? []).filter((c) => !c.archived);

  const start = async () => {
    if (!accountId || !file) return;
    setError(null);
    try {
      setBatch(await upload({ accountId, file }).unwrap());
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't read that file.");
    }
  };

  const change = async (row: ImportRowResponse, body: Parameters<typeof updateRow>[0]['body']) => {
    if (!batch) return;
    setError(null);
    try {
      setBatch(await updateRow({ batchId: batch.id, rowId: row.id, body }).unwrap());
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't change that row.");
    }
  };

  const included = (row: ImportRowResponse) =>
    !row.parseError && !excluded.has(row.id) && (!row.duplicate || includedDuplicates.has(row.id));
  const toggle = (row: ImportRowResponse, on: boolean) => {
    if (row.duplicate) {
      const next = new Set(includedDuplicates);
      if (on) next.add(row.id);
      else next.delete(row.id);
      setIncludedDuplicates(next);
    }
    const next = new Set(excluded);
    if (on) next.delete(row.id);
    else next.add(row.id);
    setExcluded(next);
  };
  const incomplete = (row: ImportRowResponse) =>
    (row.type === 'TRANSFER' ? row.toAccountId == null : row.categoryId == null) && row.type !== 'REFUND';

  const rows = batch?.rows ?? [];
  const chosen = rows.filter(included);
  const missing = chosen.filter(incomplete).length;

  const finish = async () => {
    if (!batch) return;
    setError(null);
    try {
      const result = await commit({
        batchId: batch.id,
        includeDuplicateRowIds: [...includedDuplicates],
        excludeRowIds: rows.filter((r) => !included(r)).map((r) => r.id),
      }).unwrap();
      setDone(result.rows.filter((r) => r.committedTransactionId != null).length);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't import.");
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-space-8 py-space-6">
      <button
        type="button"
        onClick={() => navigate('/ledger')}
        className="flex items-center gap-space-2 self-start text-caption text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        Ledger
      </button>

      <div className="flex flex-col gap-space-1">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Ledger · Import</span>
        <span className="text-title text-ink">Import a statement</span>
        <span className="text-caption text-ink-muted">
          The CSV your bank or card gives you. You check every row before anything is added.
        </span>
      </div>

      {done != null ? (
        <div className="flex flex-col items-start gap-space-3">
          <p className="flex items-center gap-space-2 text-body text-ink">
            <CheckCircle2 size={18} strokeWidth={1.5} className="text-positive" aria-hidden />
            {done} {done === 1 ? 'entry' : 'entries'} imported. Payments that match a planned bill were marked paid.
          </p>
          <Link to="/ledger" className="text-label text-accent underline-offset-4 hover:underline">
            See them in the Ledger →
          </Link>
        </div>
      ) : !batch ? (
        <div className="flex flex-col gap-space-4 rounded-xl border border-line p-space-5">
          <div className="grid gap-space-4 sm:grid-cols-2">
            <label className="flex flex-col gap-space-1">
              <span className="text-label text-ink">Which account is the statement for?</span>
              <Select
                variant="field"
                ariaLabel="Account"
                value={accountId ? String(accountId) : ''}
                placeholder="Choose the account"
                options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
                onChange={(v) => setAccountId(v ? Number(v) : null)}
              />
            </label>
            <label className="flex flex-col gap-space-1">
              <span className="text-label text-ink">Statement file (CSV)</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-caption text-ink-soft file:mr-space-3 file:rounded-md file:border file:border-line file:bg-surface file:px-space-3 file:py-space-1 file:text-label"
              />
            </label>
          </div>
          <p className="text-caption text-ink-muted">
            Most banks: statement → download → CSV (or Excel, then “Save as CSV”). Kosh finds the date, description and
            withdrawal/deposit columns itself.
          </p>
          {error && <p className="text-caption text-critical">{error}</p>}
          <div>
            <Button variant="primary" onClick={start} disabled={!accountId || !file || uploading}>
              <Upload size={16} strokeWidth={1.5} />
              {uploading ? 'Reading…' : 'Read the statement'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-body text-ink-soft">
            {rows.length} {rows.length === 1 ? 'line' : 'lines'} read
            {batch.duplicateRows > 0 && ` · ${batch.duplicateRows} look already recorded (left out unless you tick them)`}
            {batch.invalidRows > 0 && ` · ${batch.invalidRows} left out (reason shown)`}. Categories come from your past
            entries with the same description - check them.
          </p>

          <section>
            <SectionHeader trailing={`${chosen.length} to import`}>Check the rows</SectionHeader>
            <ul className="flex flex-col">
              {rows.map((row) => {
                const on = included(row);
                return (
                  <li
                    key={row.id}
                    className={cn('flex flex-col gap-space-2 border-b border-line py-space-3 last:border-b-0', !on && 'opacity-60')}
                  >
                    <div className="flex items-baseline gap-space-3">
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={!!row.parseError}
                        onChange={(e) => toggle(row, e.target.checked)}
                        aria-label={`Import ${row.description ?? 'this line'}`}
                        className="mt-1"
                      />
                      <span className="w-16 shrink-0 text-caption text-ink-muted">{row.date ? formatShortDate(row.date) : '—'}</span>
                      <span className="min-w-0 flex-1 truncate text-label text-ink">{row.description ?? 'Unreadable line'}</span>
                      {row.amount != null && (
                        <Amount value={row.amount} role="row" signed={row.type === 'INCOME'} className={row.type === 'INCOME' ? 'text-positive' : 'text-ink'} />
                      )}
                    </div>
                    {row.parseError ? (
                      <p className="pl-[92px] text-caption text-ink-muted">{row.parseError}</p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-space-3 pl-[92px]">
                        {row.duplicate && (
                          <span className="text-caption text-attention">Looks already recorded - tick to import anyway</span>
                        )}
                        <Select
                          variant="chip"
                          ariaLabel="What this was"
                          value={row.type ?? 'EXPENSE'}
                          options={KIND_OPTIONS}
                          onChange={(v) => change(row, { type: v as ImportRowType })}
                        />
                        {row.type === 'TRANSFER' ? (
                          <Select
                            variant="chip"
                            ariaLabel="Moved to"
                            value={row.toAccountId ? String(row.toAccountId) : ''}
                            placeholder="Moved to which account?"
                            options={transferTargets.map((a) => ({ value: String(a.id), label: a.name }))}
                            onChange={(v) => v && change(row, { toAccountId: Number(v) })}
                          />
                        ) : (
                          <CategorySelect
                            variant="row"
                            value={row.categoryId ?? ''}
                            income={row.type === 'INCOME'}
                            categories={categories.filter((c) => (row.type === 'INCOME' ? c.group === 'INCOME' : c.group !== 'INCOME'))}
                            onChange={(id) => change(row, id == null ? { clearCategory: true } : { categoryId: id })}
                          />
                        )}
                        {on && incomplete(row) && <span className="text-caption text-attention">needs {row.type === 'TRANSFER' ? 'an account' : 'a category'}</span>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {error && <p className="text-caption text-critical">{error}</p>}
          <div className="flex items-center gap-space-4">
            <Button variant="primary" onClick={finish} disabled={committing || chosen.length === 0 || missing > 0}>
              {committing ? 'Importing…' : `Import ${chosen.length} ${chosen.length === 1 ? 'entry' : 'entries'}`}
            </Button>
            {missing > 0 && (
              <span className="text-caption text-ink-muted">
                {missing} {missing === 1 ? 'row needs' : 'rows need'} a category or account first - or untick {missing === 1 ? 'it' : 'them'}.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
