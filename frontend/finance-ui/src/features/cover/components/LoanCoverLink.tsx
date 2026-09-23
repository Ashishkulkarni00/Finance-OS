import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Card } from '@/components/Card';
import { Amount } from '@/components/Amount';
import { formatDayMonthYear } from '@/lib/dates';
import { useGetInsurancePoliciesQuery } from '@/services/insuranceService';

/**
 * "This is paying for" - the policy whose premium this loan is repaying.
 *
 * <p>Answers the question the data otherwise poses and never explains: <em>why is "Health
 * Insurance" sitting in Debts as a loan?</em> Because the premium was financed on a card.
 * The debt is real and stays a debt (ADR-0016); this says what it bought.
 *
 * <p>Renders nothing when no policy points at this loan, which is every loan that is just
 * a loan.
 */
export function LoanCoverLink({ loanId }: { loanId: number }) {
  const { data: page } = useGetInsurancePoliciesQuery({ includeArchived: true });
  const policy = (page?.content ?? []).find((p) => p.loanId === loanId);
  if (!policy) return null;

  return (
    <Card domainRule="commit" className="flex items-start gap-space-3">
      <ShieldCheck size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-soft" aria-hidden />
      <div className="min-w-0 flex-1">
        <span className="text-label font-semibold text-ink">This is paying for</span>
        <p className="mt-space-1 text-body text-ink-soft">
          <Link to="/money/cover" className="underline-offset-2 hover:text-ink hover:underline">
            {policy.name}
          </Link>
          {policy.insurer && ` · ${policy.insurer}`}
        </p>
        <p className="mt-space-1 flex flex-wrap items-baseline gap-space-2 text-caption text-ink-muted">
          {policy.coverAmount && (
            <span>
              <Amount value={policy.coverAmount} role="caption" className="text-ink" /> cover
            </span>
          )}
          {policy.renewsOn && <span>· renews {formatDayMonthYear(policy.renewsOn)}</span>}
          {policy.status === 'LAPSED' && <span className="text-critical">· lapsed</span>}
        </p>
        {/* The instalments and the cover are two different clocks, and they rarely line up. */}
        <p className="mt-space-2 text-caption text-ink-muted">
          The cover and these instalments run on their own dates — paying this off doesn’t extend the policy.
        </p>
      </div>
    </Card>
  );
}
