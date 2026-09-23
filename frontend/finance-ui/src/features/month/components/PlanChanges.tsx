import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { CalendarClock, ChevronRight } from 'lucide-react';
import { Row } from '@/components/Row';
import { formatMoney } from '@/lib/money';
import { cycleMonthName, formatShortDate, ordinalDay, shiftIsoDays } from '@/lib/dates';
import { useGetCommitmentRulesQuery } from '@/services/commitmentRuleService';
import { isOneOff } from '@/features/plan/components/commitmentForm';
import type { CommitmentResponse } from '@/types/commitmentRule';
import type { CycleResponse } from '@/types/cycle';

interface Change {
  key: string;
  ruleId: number;
  /** The thing that changed - almost always the bill's own name. */
  primary: string;
  /** What happened to it, and what it's worth. */
  secondary: string;
}

const amountOf = (r: CommitmentResponse) => (r.amountType === 'FIXED' ? formatMoney(r.fixedAmount) : 'an amount that varies');
const verb = (r: CommitmentResponse) => (r.settleAs === 'INCOME' ? 'comes in' : r.settleAs === 'EXPENSE' ? 'is paid' : 'is moved');

interface PlanChangesProps {
  cycle: CycleResponse | undefined;
  title?: string;
  /**
   * `card` is the standalone callout with its own icon and border, used on Month Close.
   * `rows` is the ruled list used inside the Months tab strip, where the tab already
   * provides the heading and the frame - a bordered card inside a tab panel is two boxes
   * doing one box's job.
   */
  chrome?: 'card' | 'rows';
  /**
   * What to say when the month runs exactly like the one before. Without it the component
   * renders nothing, which is right for a callout and wrong inside a tab - a tab you can
   * click that then shows nothing reads as a bug.
   */
  emptyNote?: string;
}

/**
 * "What's different this month" - the planned changes that land in the month being viewed,
 * so a decision made in September (a bonus in November, an RD stopping, a bigger emergency
 * fund transfer) is visible when that month comes, not only on the bill it changed.
 * Read from the rules' own dates (PLANNED_CHANGES.md §2.2); renders nothing when the month
 * is like the one before.
 *
 * <p><strong>The plan's first month is the baseline and reports no differences.</strong>
 * Every bill starts in it, so comparing it with the month before announced the entire plan
 * as a change - true, and useless. "Different" only means anything once there is a month
 * to be different from.
 */
export function PlanChanges({ cycle, title = 'What’s different this month', chrome = 'card', emptyNote }: PlanChangesProps) {
  const navigate = useNavigate();
  const { data: page } = useGetCommitmentRulesQuery();
  if (!cycle || !page) return emptyNote ? <Empty>{emptyNote}</Empty> : null;

  const rules = page.content.filter((r) => !r.archived);

  /**
   * The month the plan begins is the **baseline** and reports no differences; months
   * before it report nothing at all.
   *
   * Every bill starts in the first month, so comparing it with the month before announces
   * the whole plan as a change - true, and useless: that isn't a change, it's the plan.
   * "Different" only means something once there is a month to be different from.
   *
   * <p><strong>The plan begins with the first month money comes in.</strong> This product
   * is salary-to-salary: Real Balance, Room and every figure on Months is anchored on
   * income, so a month before the first salary isn't a month the system can reason about -
   * it's a month that didn't happen yet. Using income rather than "the earliest bill of
   * any kind" also makes this immune to a single bill dated into a month you never used,
   * which is exactly what {@code createFromInvestment} produces by default.
   *
   * <p>Falls back to the earliest bill when no income is recorded at all, so a plan
   * without a salary still behaves sensibly rather than treating every month as the first.
   */
  const earliestOf = (of: CommitmentResponse[]) =>
    of.reduce<string | null>((earliest, r) => (earliest == null || r.activeFrom < earliest ? r.activeFrom : earliest), null);

  const planStart = earliestOf(rules.filter((r) => r.settleAs === 'INCOME')) ?? earliestOf(rules);
  if (planStart != null && cycle.startDate <= planStart) {
    if (!emptyNote) return null;
    const month = cycleMonthName(cycle.endDate);
    return (
      <Empty>
        {cycle.startDate === planStart
          ? `${month} is where your plan starts, so there’s nothing before it to compare against. From next month, anything that starts, stops or changes amount shows up here.`
          : `Nothing is planned for ${month} — your plan starts later.`}
      </Empty>
    );
  }

  const inCycle = (d: string | null | undefined) => d != null && d >= cycle.startDate && d <= cycle.endDate;
  const dayBefore = shiftIsoDays(cycle.startDate, -1);
  // The month before, approximately - only used to find rules that ended in it.
  const previousStart = shiftIsoDays(cycle.startDate, -31);
  const changes: Change[] = [];
  const starting: Change[] = [];

  for (const r of rules) {
    if (isOneOff(r)) {
      if (inCycle(r.activeFrom)) {
        changes.push({
          key: `once-${r.id}`,
          ruleId: r.id,
          primary: r.name,
          secondary: `One-off · ${amountOf(r)} ${verb(r)} on the ${ordinalDay(r.dueDay)}`,
        });
      }
      continue;
    }
    if (inCycle(r.activeFrom)) {
      // A new bill, or the later half of an "apply from" change (its earlier half ended the day before).
      const before = rules.find((p) => p.id !== r.id && p.name === r.name && p.activeTo === dayBefore && !isOneOff(p));
      if (before) {
        changes.push({
          key: `change-${r.id}`,
          ruleId: r.id,
          primary: r.name,
          secondary: `Changes from this month · ${amountOf(before)} → ${amountOf(r)}`,
        });
      } else {
        starting.push({
          key: `start-${r.id}`,
          ruleId: r.id,
          primary: r.name,
          secondary: `Starts this month · ${amountOf(r)}`,
        });
      }
    }
    if (inCycle(r.activeTo)) {
      const next = rules.find((n) => n.id !== r.id && n.name === r.name && n.activeFrom === shiftIsoDays(r.activeTo!, 1));
      changes.push(
        next
          ? {
              key: `next-${r.id}`,
              ruleId: next.id,
              primary: r.name,
              secondary: `Changes next month · ${amountOf(r)} → ${amountOf(next)}`,
            }
          : {
              key: `last-${r.id}`,
              ruleId: r.id,
              primary: r.name,
              secondary: `Last payment this month · ${formatShortDate(r.activeTo!)}`,
            },
      );
    } else if (r.activeTo != null && r.activeTo >= previousStart && r.activeTo <= dayBefore) {
      const continued = rules.some((n) => n.id !== r.id && n.name === r.name && n.activeFrom === cycle.startDate);
      if (!continued) {
        changes.push({
          key: `stop-${r.id}`,
          ruleId: r.id,
          primary: r.name,
          secondary: 'Stopped last month · no longer in this plan',
        });
      }
    }
  }

  // Past the plan's first month, a bill that starts is genuinely news - listed one by one,
  // since there is no longer a whole-plan case to collapse into a single line.
  changes.push(...starting);
  if (changes.length === 0) return emptyNote ? <Empty>{emptyNote}</Empty> : null;

  if (chrome === 'rows') {
    return (
      <div className="flex flex-col">
        {changes.map((c) => (
          <Row
            key={c.key}
            domainRule="commit"
            primary={c.primary}
            secondary={c.secondary}
            trailing={<ChevronRight size={16} strokeWidth={1.5} className="text-ink-muted" aria-hidden />}
            onClick={() => navigate(`/commitment-rules/${c.ruleId}`)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-space-6 flex items-start gap-space-3 rounded-xl border border-line bg-surface p-space-4">
      <CalendarClock size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      <div className="flex min-w-0 flex-col gap-space-1">
        <p className="text-body text-ink">{title}</p>
        <ul className="flex flex-col gap-space-1">
          {changes.map((c) => (
            <li key={c.key} className="text-caption text-ink-soft">
              <Link to={`/commitment-rules/${c.ruleId}`} className="underline-offset-2 hover:text-ink hover:underline">
                {c.primary} — {c.secondary}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-caption text-ink-muted">{children}</p>;
}
