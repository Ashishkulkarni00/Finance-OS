import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { useGetCommitmentRulesQuery, useUpdateCommitmentRuleMutation } from '@/services/commitmentRuleService';
import { useGetCommitmentInstancesForCycleQuery } from '@/services/commitmentInstanceService';
import { useGetCurrentCycleQuery } from '@/services/cycleService';
import type { GoalResponse } from '@/types/goal';
import type { CommitmentResponse } from '@/types/commitmentRule';
import { AddCommitmentSheet } from './AddCommitmentSheet';
import { suggestSource } from './billSources';
import { isOneOff } from './commitmentForm';
import { cycleMonthName, ordinalDay } from '@/lib/dates';

/**
 * What a funder actually puts in.
 *
 * <p>A one-off's occurrence wins over its rule: there is only one, so the rule's figure is
 * not a standing amount that this month happens to differ from - it is simply out of date.
 * When the two disagree the rule's figure is still shown, quietly, because the funder's own
 * page will say that number and a silent substitution here would look like a different bug.
 *
 * <p>A recurring funder is left alone. It has no single month, so its rule's amount is the
 * honest answer and this month's occurrence is a detail that belongs on Months.
 */
function FunderAmount({ rule, occurrence }: { rule: CommitmentResponse; occurrence: string | null }) {
  const differs = occurrence != null && rule.fixedAmount != null && Number(occurrence) !== Number(rule.fixedAmount);
  const shown = occurrence ?? rule.fixedAmount;
  if (shown == null) {
    return <span className="text-caption text-ink-muted">varies</span>;
  }
  return (
    <span className="flex flex-col items-end">
      <Amount value={shown} role="row" className="text-ink" />
      {differs && (
        <span className="text-micro text-ink-muted">
          set to this, from <Amount value={rule.fixedAmount} role="caption" />
        </span>
      )}
    </span>
  );
}

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
  // A one-off has exactly one occurrence, so the rule's amount is not "usually" - it is a
  // figure that will never happen if that occurrence was changed. The user set October's
  // top-up to ₹15,000 and this list still read ₹17,000. A *recurring* funder is the opposite
  // case: it has no single month, so the rule's amount is the honest thing and this leaves
  // it alone.
  const { data: cycle } = useGetCurrentCycleQuery();
  const { data: cycleInstances } = useGetCommitmentInstancesForCycleQuery(cycle?.id ?? 0, { skip: !cycle });
  const occurrenceAmount = (ruleId: number) =>
    (cycleInstances ?? []).find((i) => i.commitmentId === ruleId)?.expectedAmount ?? null;

  const funding = all.filter(
    // Paid as an expense, a goal-linked bill is a payment the goal makes (GoalPayments), not funding.
    (r) =>
      r.sourceType === 'GOAL' &&
      r.sourceId === goal.id &&
      r.settleAs !== 'EXPENSE' &&
      !(isOneOff(r) && r.activeTo != null && r.activeTo < today),
  );
  const sources = { loans: [], investments: [], goals: [goal] };
  const candidate =
    funding.length === 0
      ? all.find(
          (r) =>
            r.sourceType === 'MANUAL' &&
            suggestSource({ name: r.name, amountType: r.amountType, fixedAmount: r.fixedAmount, toAccountId: r.toAccountId ?? null }, sources) != null,
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
                  {/* `ordinalDay`, not `${dueDay}th` - this file was missed when that helper
                      landed, so a top-up on the 2nd read "on the 2th". Right for 21 days of
                      28 and wrong for the rest, with 11/12/13 the trap. */}
                  {isOneOff(r) && r.activeTo
                    ? `from ${r.account.name} · once, in ${cycleMonthName(r.activeTo)} (on the ${ordinalDay(r.dueDay)})`
                    : `from ${r.account.name} on the ${ordinalDay(r.dueDay)}, every month`}
                </span>
              </Link>
              <FunderAmount rule={r} occurrence={isOneOff(r) ? occurrenceAmount(r.id) : null} />
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
