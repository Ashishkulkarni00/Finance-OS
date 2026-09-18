import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { useGetCommitmentRulesQuery, useUpdateCommitmentRuleMutation } from '@/services/commitmentRuleService';
import type { GoalResponse } from '@/types/goal';
import { AddCommitmentSheet } from './AddCommitmentSheet';
import { suggestSource } from './billSources';
import { isOneOff } from './commitmentForm';
import { cycleMonthName } from '@/lib/dates';

/**
 * "What pays into this goal?" - the bills that fund it, and the way to add one.
 *
 * <p>A goal's progress is its account's balance; this is the plan that moves it. A bill
 * that funds a goal is a monthly transfer into the goal's account, set aside before salary
 * runs out and marked paid when the transfer is recorded. A hand-typed bill that already
 * does this (by name, or by moving money into the goal's account) is offered for linking.
 */
export function GoalFunding({ goal }: { goal: GoalResponse }) {
  const { data: rules } = useGetCommitmentRulesQuery();
  const [updateRule, { isLoading: linking }] = useUpdateCommitmentRuleMutation();
  const [adding, setAdding] = useState<'monthly' | 'once' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (goal.linkedAccountId == null) {
    return (
      <section>
        <SectionHeader>Funded by</SectionHeader>
        <p className="text-caption text-ink-muted">
          Keep this goal in an account to plan a monthly transfer into it.
        </p>
      </section>
    );
  }

  const all = (rules?.content ?? []).filter((r) => !r.archived);
  const today = new Date().toISOString().slice(0, 10);
  // A one-off top-up whose month is over has done its job; it stays in that month's history.
  const funding = all.filter(
    (r) => r.sourceType === 'GOAL' && r.sourceId === goal.id && !(isOneOff(r) && r.activeTo != null && r.activeTo < today),
  );
  const sources = { loans: [], investments: [], goals: [goal] };
  const candidate =
    funding.length === 0
      ? all.find(
          (r) =>
            r.sourceType === 'MANUAL' &&
            suggestSource({ name: r.name, amountType: r.amountType, fixedAmount: r.fixedAmount, toAccountId: r.toAccountId }, sources) != null,
        )
      : undefined;

  const link = async () => {
    if (!candidate) return;
    setError(null);
    try {
      await updateRule({
        id: candidate.id,
        body: { sourceType: 'GOAL', sourceId: goal.id, settleAs: 'TRANSFER', toAccountId: goal.linkedAccountId ?? undefined },
      }).unwrap();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't link that bill.");
    }
  };

  return (
    <section>
      <SectionHeader
        trailing={
          <span className="flex items-baseline gap-space-4">
            <button type="button" onClick={() => setAdding('once')} className="text-accent underline-offset-4 hover:underline">
              + One-off top-up
            </button>
            <button type="button" onClick={() => setAdding('monthly')} className="text-accent underline-offset-4 hover:underline">
              + Fund it monthly
            </button>
          </span>
        }
      >
        Funded by
      </SectionHeader>
      {funding.length > 0 ? (
        <ul className="flex flex-col">
          {funding.map((r) => (
            <li key={r.id} className="flex items-baseline justify-between gap-space-3 border-b border-line py-space-3 last:border-b-0">
              <Link to={`/commitment-rules/${r.id}`} className="text-row text-ink hover:underline hover:underline-offset-4">
                {r.name}
                <span className="block text-caption text-ink-muted">
                  {isOneOff(r) && r.activeTo
                    ? `from ${r.account.name} · once, in ${cycleMonthName(r.activeTo)} (on the ${r.dueDay}th)`
                    : `from ${r.account.name} on the ${r.dueDay}th, every month`}
                </span>
              </Link>
              {r.fixedAmount ? <Amount value={r.fixedAmount} role="row" className="text-ink" /> : <span className="text-caption text-ink-muted">varies</span>}
            </li>
          ))}
        </ul>
      ) : candidate ? (
        <div className="flex flex-col items-start gap-space-2">
          <p className="text-caption text-ink-soft">
            “{candidate.name}” looks like it pays into this goal, but isn’t linked - so paying it by transfer can’t mark it
            paid.
          </p>
          <Button size="sm" variant="secondary" disabled={linking} onClick={link}>
            Link “{candidate.name}”
          </Button>
          {error && <span className="text-caption text-critical">{error}</span>}
        </div>
      ) : (
        <p className="text-caption text-ink-muted">
          Nothing pays into this goal yet. A monthly transfer makes the target date something you can plan for.
        </p>
      )}
      {adding && (
        <AddCommitmentSheet
          open
          onClose={() => setAdding(null)}
          preset={{
            kind: 'GOAL',
            once: adding === 'once',
            name: adding === 'once' ? `${goal.name} top-up` : `${goal.name} contribution`,
            sourceType: 'GOAL',
            sourceId: goal.id,
            goalName: goal.name,
            toAccountId: goal.linkedAccountId,
          }}
        />
      )}
    </section>
  );
}
