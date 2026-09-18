import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { formatShortDate, shiftIsoDays } from '@/lib/dates';
import { useGetCommitmentRulesQuery } from '@/services/commitmentRuleService';
import { isOneOff } from '@/features/plan/components/commitmentForm';
import type { CommitmentResponse } from '@/types/commitmentRule';
import type { CycleResponse } from '@/types/cycle';

interface Change {
  key: string;
  ruleId: number;
  text: string;
}

const amountOf = (r: CommitmentResponse) => (r.amountType === 'FIXED' ? formatMoney(r.fixedAmount) : 'an amount that varies');
const verb = (r: CommitmentResponse) => (r.settleAs === 'INCOME' ? 'comes in' : r.settleAs === 'EXPENSE' ? 'is paid' : 'is moved');

/**
 * "What's different this month" - the planned changes that land in the month being viewed,
 * so a decision made in September (a bonus in November, an RD stopping, a bigger emergency
 * fund transfer) is visible when that month comes, not only on the bill it changed.
 * Read from the rules' own dates (PLANNED_CHANGES.md §2.2); renders nothing when the month
 * is like the one before.
 */
export function PlanChanges({ cycle }: { cycle: CycleResponse | undefined }) {
  const { data: page } = useGetCommitmentRulesQuery();
  if (!cycle || !page) return null;

  const rules = page.content.filter((r) => !r.archived);
  const inCycle = (d: string | null | undefined) => d != null && d >= cycle.startDate && d <= cycle.endDate;
  const dayBefore = shiftIsoDays(cycle.startDate, -1);
  // The month before, approximately - only used to find rules that ended in it.
  const previousStart = shiftIsoDays(cycle.startDate, -31);
  const changes: Change[] = [];
  const starting: Change[] = [];

  for (const r of rules) {
    if (isOneOff(r)) {
      if (inCycle(r.activeFrom)) {
        changes.push({ key: `once-${r.id}`, ruleId: r.id, text: `One-off: ${r.name} - ${amountOf(r)} ${verb(r)} this month (on the ${r.dueDay}th)` });
      }
      continue;
    }
    if (inCycle(r.activeFrom)) {
      // A new bill, or the later half of an "apply from" change (its earlier half ended the day before).
      const before = rules.find((p) => p.id !== r.id && p.name === r.name && p.activeTo === dayBefore && !isOneOff(p));
      if (before) {
        changes.push({ key: `change-${r.id}`, ruleId: r.id, text: `${r.name} changes from this month: ${amountOf(before)} → ${amountOf(r)}` });
      } else {
        starting.push({ key: `start-${r.id}`, ruleId: r.id, text: `${r.name} starts this month - ${amountOf(r)}` });
      }
    }
    if (inCycle(r.activeTo)) {
      const next = rules.find((n) => n.id !== r.id && n.name === r.name && n.activeFrom === shiftIsoDays(r.activeTo!, 1));
      changes.push(
        next
          ? { key: `next-${r.id}`, ruleId: next.id, text: `${r.name} changes next month: ${amountOf(r)} → ${amountOf(next)}` }
          : { key: `last-${r.id}`, ruleId: r.id, text: `Last ${r.name} this month (${formatShortDate(r.activeTo!)})` },
      );
    } else if (r.activeTo != null && r.activeTo >= previousStart && r.activeTo <= dayBefore) {
      const continued = rules.some((n) => n.id !== r.id && n.name === r.name && n.activeFrom === cycle.startDate);
      if (!continued) {
        changes.push({ key: `stop-${r.id}`, ruleId: r.id, text: `${r.name} stopped last month - no longer in this plan` });
      }
    }
  }

  // The first planned month starts every bill at once - one line says that better than a dozen.
  const recurring = rules.filter((r) => !isOneOff(r)).length;
  if (starting.length > 3 && starting.length * 2 > recurring) {
    changes.unshift({ key: 'plan-starts', ruleId: starting[0]!.ruleId, text: `Your plan starts this month - ${starting.length} bills begin` });
  } else {
    changes.push(...starting);
  }
  if (changes.length === 0) return null;

  return (
    <div className="mb-space-6 flex items-start gap-space-3 rounded-xl border border-line bg-surface p-space-4">
      <CalendarClock size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      <div className="flex min-w-0 flex-col gap-space-1">
        <p className="text-body text-ink">What’s different this month</p>
        <ul className="flex flex-col gap-space-1">
          {changes.map((c) => (
            <li key={c.key} className="text-caption text-ink-soft">
              <Link to={`/commitment-rules/${c.ruleId}`} className="underline-offset-2 hover:text-ink hover:underline">
                {c.text}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
