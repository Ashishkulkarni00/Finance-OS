import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { useCreateBillFromLoanMutation, useGetCommitmentRulesQuery, useUpdateCommitmentRuleMutation } from '@/services/commitmentRuleService';
import { bestManualBill, loanTarget } from '@/features/plan/billMatch';
import type { CommitmentResponse } from '@/types/commitmentRule';
import type { LoanResponse } from '@/types/loan';

/**
 * A hand-typed bill that is probably this loan's EMI: same amount, a name that points at the
 * loan (or says "EMI"), not linked to anything - see {@link bestManualBill}.
 */
export function matchingManualBill(loan: LoanResponse, rules: CommitmentResponse[] | undefined): CommitmentResponse | undefined {
  return bestManualBill(loanTarget(loan), rules);
}

/** Whether this loan's EMI still needs to be put in the plan. */
export function loanNeedsPlanBill(loan: LoanResponse): boolean {
  return loan.planCommitmentId == null && loan.status !== 'CLOSED' && loan.emisLeft > 0;
}

/**
 * "Is this EMI in my plan?" - and the one click that puts it there.
 *
 * <p>If a bill already pays it, links to that bill. If a hand-typed bill looks like it
 * (the user's existing EMI bills), offers to <em>link</em> that one rather than add a
 * second copy - its history stays. Otherwise offers to add the EMI as a new bill that
 * follows the loan. Without a paying account there's nothing to plan from yet.
 */
export function LoanPlanLink({ loan }: { loan: LoanResponse }) {
  const { data: rules } = useGetCommitmentRulesQuery();
  const [createBill, { isLoading: adding }] = useCreateBillFromLoanMutation();
  const [updateRule, { isLoading: linking }] = useUpdateCommitmentRuleMutation();
  const [error, setError] = useState<string | null>(null);

  if (loan.planCommitmentId != null) {
    return (
      <Link to={`/commitment-rules/${loan.planCommitmentId}`} className="text-caption text-accent underline-offset-2 hover:underline">
        In your plan — open the bill
      </Link>
    );
  }
  if (!loanNeedsPlanBill(loan)) return null;
  if (!loan.payFromAccount) {
    return <span className="text-caption text-ink-muted">Record the account it’s paid from, then add it to the plan.</span>;
  }

  const match = matchingManualBill(loan, rules?.content);
  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't update the plan.");
    }
  };

  return (
    <span className="flex flex-col items-start gap-space-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {match ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={linking}
          onClick={() => run(() => updateRule({ id: match.id, body: { sourceType: 'LOAN', sourceId: loan.id } }).unwrap())}
        >
          Link to “{match.name}”
        </Button>
      ) : (
        <Button size="sm" variant="secondary" disabled={adding} onClick={() => run(() => createBill(loan.id).unwrap())}>
          Add EMI to plan
        </Button>
      )}
      {match && (
        <span className="text-caption text-ink-muted">
          Your bill takes its amount, day and last payment from the loan from then on.
        </span>
      )}
      {error && <span className="text-caption text-critical">{error}</span>}
    </span>
  );
}
