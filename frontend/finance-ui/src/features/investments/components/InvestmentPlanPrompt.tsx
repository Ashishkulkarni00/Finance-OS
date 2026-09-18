import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { formatMoney } from '@/lib/money';
import {
  useCreateBillFromInvestmentMutation,
  useGetCommitmentRulesQuery,
  useUpdateCommitmentRuleMutation,
} from '@/services/commitmentRuleService';
import { bestManualBill, investmentTarget } from '@/features/plan/billMatch';
import type { CommitmentResponse } from '@/types/commitmentRule';
import type { InvestmentResponse } from '@/types/investment';

const TINT_STYLE = { backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' } as const;

/** A hand-typed bill that is probably this holding's instalment - same amount, a name that
 *  points at it (or says "SIP"), not linked. Not "Petrol" just because it's also ₹2,500. */
function matchingBill(investment: InvestmentResponse, rules: CommitmentResponse[] | undefined) {
  return bestManualBill(investmentTarget(investment), rules);
}

function Prompt({ investment, rules }: { investment: InvestmentResponse; rules: CommitmentResponse[] | undefined }) {
  const [createBill, { isLoading: adding }] = useCreateBillFromInvestmentMutation();
  const [updateRule, { isLoading: linking }] = useUpdateCommitmentRuleMutation();
  const [error, setError] = useState<string | null>(null);
  const match = matchingBill(investment, rules);

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't update the plan.");
    }
  };

  return (
    <div className="flex items-start gap-space-3 rounded-xl p-space-4" style={TINT_STYLE}>
      <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-space-1">
        <p className="text-body text-ink">{investment.name} — its monthly instalment isn’t in your plan</p>
        <p className="num text-caption text-attention">
          {formatMoney(investment.monthlyContribution)} leaves {investment.payFromAccount?.name} every month
          {match ? `, and “${match.name}” looks like it but isn’t linked.` : ', and nothing on Months counts it.'}
        </p>
        <p className="text-caption text-ink-muted">
          In the plan, it’s set aside before it leaves, and recording the investment marks it paid - not as spending.
        </p>
        <div className="mt-space-2 flex flex-wrap items-center gap-space-3">
          {match ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={linking}
              onClick={() => run(() => updateRule({ id: match.id, body: { sourceType: 'INVESTMENT', sourceId: investment.id } }).unwrap())}
            >
              Link “{match.name}”
            </Button>
          ) : (
            <Button size="sm" variant="secondary" disabled={adding} onClick={() => run(() => createBill(investment.id).unwrap())}>
              Add instalment to plan
            </Button>
          )}
          {error && <span className="text-caption text-critical">{error}</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * Holdings with a monthly instalment that the plan doesn't know about yet - one click puts
 * each in it (or links the bill already typed for it). Renders nothing when there are none.
 */
export function InvestmentPlanPrompt({ investments }: { investments: InvestmentResponse[] }) {
  const { data: rules } = useGetCommitmentRulesQuery();
  const unplanned = investments.filter((i) => i.monthlyContribution != null && i.payFromAccount != null && i.planCommitmentId == null);
  if (unplanned.length === 0) return null;
  return (
    <section>
      <SectionHeader trailing={`${unplanned.length} to put in the plan`}>Not in your plan</SectionHeader>
      <div className="flex flex-col gap-space-3">
        {unplanned.map((i) => (
          <Prompt key={i.id} investment={i} rules={rules?.content} />
        ))}
      </div>
    </section>
  );
}
