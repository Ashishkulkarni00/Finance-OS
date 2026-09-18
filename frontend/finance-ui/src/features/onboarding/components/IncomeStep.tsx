import { useState } from 'react';
import { Row } from '@/components/Row';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { formatMoney } from '@/lib/money';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCategoriesQuery } from '@/services/categoryService';
import { useGetCommitmentRulesQuery, useCreateCommitmentRuleMutation } from '@/services/commitmentRuleService';
import { useGetCurrentCycleQuery } from '@/services/cycleService';
import { useGetMeQuery } from '@/services/userService';

interface IncomeStepProps {
  onContinue: () => void;
}

/**
 * "What comes in?" - salary as expected income, so the month can be set against it from
 * day one (PRODUCT_AUDIT §4, onboarding step 1). The day is the pay day chosen two steps
 * back; only the amount and the account are asked. It is never counted as spendable
 * before it lands - recording the credit replaces the estimate.
 */
export function IncomeStep({ onContinue }: IncomeStepProps) {
  const { data: me } = useGetMeQuery();
  const { data: accountsPage } = useGetAccountsQuery();
  const { data: categoriesPage } = useGetCategoriesQuery();
  const { data: rulesPage } = useGetCommitmentRulesQuery();
  const { data: cycle } = useGetCurrentCycleQuery();
  const [createRule, { isLoading }] = useCreateCommitmentRuleMutation();

  // Income lands in a bank or cash account.
  const accounts = accountsPage?.content.filter((a) => !a.archived && (a.type === 'BANK' || a.type === 'CASH')) ?? [];
  const incomeRules = (rulesPage?.content ?? []).filter((r) => r.settleAs === 'INCOME' && !r.archived);
  // Filed under the user's salary category when there is one, so recording it is one tap.
  const salaryCategory = categoriesPage?.content.find((c) => !c.archived && c.group === 'INCOME' && /salary/i.test(c.name));

  const [name, setName] = useState('Salary');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const payDay = Math.min(me?.cycleStartDay ?? 1, 28);

  const handleAdd = async () => {
    setError(null);
    const account = accountId ?? accounts[0]?.id;
    if (!name.trim() || !account || !amount) {
      setError('What it is, how much, and which account it lands in.');
      return;
    }
    try {
      await createRule({
        name: name.trim(),
        amountType: 'FIXED',
        fixedAmount: amount,
        frequency: 'MONTHLY',
        dueDay: payDay,
        accountId: account,
        categoryId: salaryCategory?.id ?? null,
        mandatory: true,
        settleAs: 'INCOME',
        activeFrom: cycle?.startDate ?? new Date().toISOString().slice(0, 10),
      }).unwrap();
      setName('');
      setAmount('');
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't add that.");
    }
  };

  return (
    <div className="flex flex-col gap-space-6">
      <div>
        <h1 className="text-editorial font-serif text-ink">What comes in?</h1>
        <p className="mt-space-2 text-body text-ink-muted">
          Your take-home salary, on the {payDay}th. It’s used to plan the month against your bills before it lands - never
          counted as money you can spend until it arrives.
        </p>
      </div>

      {incomeRules.length > 0 && (
        <div className="flex flex-col">
          {incomeRules.map((r) => (
            <Row
              key={r.id}
              primary={r.name}
              secondary={`On the ${r.dueDay} · into ${r.account.name}`}
              trailing={<span className="num text-row text-positive">+{formatMoney(r.fixedAmount)}</span>}
            />
          ))}
        </div>
      )}

      {accounts.length === 0 ? (
        <p className="text-caption text-ink-muted">Add the account your salary lands in first.</p>
      ) : (
        <div className="flex flex-col gap-space-3 rounded-xl border border-line bg-surface p-space-5">
          <div className="grid grid-cols-3 gap-space-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Salary"
              aria-label="What it is"
              className="col-span-3 h-11 rounded-lg border border-border bg-surface px-space-3 text-label text-ink sm:col-span-1"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="Take-home amount"
              aria-label="Take-home amount"
              className="num h-11 rounded-lg border border-border bg-surface px-space-3 text-label text-ink"
            />
            <Select
              ariaLabel="Account it lands in"
              value={String(accountId ?? accounts[0]?.id ?? '')}
              placeholder="Lands in"
              onChange={(v) => setAccountId(v ? Number(v) : null)}
              options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
            />
          </div>
          {error && <span className="text-caption text-critical">{error}</span>}
          <div>
            <Button type="button" variant="secondary" onClick={handleAdd} disabled={isLoading}>
              {incomeRules.length > 0 ? 'Add other income' : 'Add salary'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-space-4">
        <Button variant="primary" onClick={onContinue}>
          Continue
        </Button>
        {incomeRules.length === 0 && (
          <button type="button" onClick={onContinue} className="text-label text-ink-muted hover:text-ink-soft">
            I'll add this later
          </button>
        )}
      </div>
    </div>
  );
}
