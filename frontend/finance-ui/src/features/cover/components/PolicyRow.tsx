import { Amount } from '@/components/Amount';
import { Row } from '@/components/Row';
import { StatusPill } from '@/components/StatusPill';
import { formatDayMonthYear } from '@/lib/dates';
import type { InsurancePolicyResponse } from '@/types/insurance';

/**
 * When cover lapses, said the way you'd say it out loud.
 *
 * <p>Days rather than a date while it's close, because "in 11 days" is a decision and
 * "7 Oct 2026" needs mental arithmetic first - the same rule as the plan's due dates.
 * Silent when no renewal date was recorded: we don't know, and saying nothing is the only
 * honest option (ADR-0006).
 */
function renewalNote(policy: InsurancePolicyResponse): string | null {
  if (policy.renewsOn == null || policy.daysToRenewal == null) {
    return 'No renewal date recorded';
  }
  const days = policy.daysToRenewal;
  if (days < 0) {
    return `Lapsed ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`;
  }
  if (days === 0) return 'Renews today';
  if (days === 1) return 'Renews tomorrow';
  if (days <= 60) return `Renews in ${days} days`;
  return `Renews ${formatDayMonthYear(policy.renewsOn)}`;
}

/** One policy: what it covers, for how much, and when it runs out. */
export function PolicyRow({ policy, onOpen }: { policy: InsurancePolicyResponse; onOpen: () => void }) {
  const who = policy.covers ? ` · ${policy.covers}` : '';
  const insurer = policy.insurer ? ` · ${policy.insurer}` : '';
  const lastFour = policy.policyLastFour ? ` ··${policy.policyLastFour}` : '';

  return (
    <Row
      primary={
        <span className="flex items-center gap-space-2">
          {policy.name}
          {policy.status === 'LAPSED' && <StatusPill tone="critical">Lapsed</StatusPill>}
          {policy.status === 'RENEWS_SOON' && <StatusPill tone="attention">Renews soon</StatusPill>}
          {policy.archived && <StatusPill tone="neutral">Stopped</StatusPill>}
        </span>
      }
      secondary={`${policy.typeLabel}${who}${insurer}${lastFour} · ${renewalNote(policy)}`}
      trailing={
        <span className="flex flex-col items-end">
          {/* Cover, not an amount held - so it is never coloured or signed like a balance. */}
          <Amount value={policy.coverAmount} role="row" className="text-ink" />
          <span className="text-caption text-ink-muted">
            {policy.monthlyCost == null ? 'premium not recorded' : `${policy.premiumFrequency === 'ONE_OFF' ? 'one-off' : 'cover'}`}
          </span>
        </span>
      }
      onClick={onOpen}
    />
  );
}
