import { Link } from 'react-router-dom';
import { Amount } from '@/components/Amount';
import { SectionHeader } from '@/components/SectionHeader';
import { formatMoney } from '@/lib/money';
import { formatShortDate, formatDayMonthYear } from '@/lib/dates';
import { useGetCyclePlanChangesQuery } from '@/services/planRevisionService';
import type { CycleResponse } from '@/types/cycle';
import type { PlanFieldChange, PlanRevisionResponse } from '@/types/plan';

/**
 * "What you changed this month" - the decisions themselves, read from the plan's change
 * log (ADR-0015).
 *
 * Distinct from {@link PlanChanges} next door, and both earn their place: that one answers
 * "why does *this month* look different from the last", derived from the bills' own dates,
 * and works for a month that hasn't happened yet. This one answers "what did I *decide*,
 * when, and what did it cost" - including an amendment that moved no date at all, which
 * the date-derived version cannot see by construction.
 *
 * Renders nothing when the plan didn't move. A month in which you changed nothing should
 * say nothing, not "0 changes".
 */
interface PlanDecisionsProps {
  cycle: CycleResponse | undefined;
  /** Off inside a tab panel, where the tab already names the section. */
  heading?: boolean;
  /**
   * What to say when the plan didn't move. Without it the component renders nothing, which
   * is right when it sits among other sections and wrong inside a tab.
   */
  emptyNote?: string;
}

export function PlanDecisions({ cycle, heading = true, emptyNote }: PlanDecisionsProps) {
  const { data } = useGetCyclePlanChangesQuery(cycle?.id ?? 0, { skip: !cycle });

  if (!data || data.revisions.length === 0) {
    return emptyNote ? <p className="text-caption text-ink-muted">{emptyNote}</p> : null;
  }

  // Newest first here, though the server sends oldest first: as a log it reads as a story,
  // but on a month page the thing you did last is the thing you're looking for.
  const revisions = [...data.revisions].reverse();

  return (
    <section className={heading ? 'mb-space-6' : undefined}>
      {heading ? (
        <SectionHeader trailing={<NetEffect data={data} />}>What you changed this month</SectionHeader>
      ) : (
        <p className="mb-space-3">
          <NetEffect data={data} />
        </p>
      )}
      <ul className="flex flex-col">
        {revisions.map((r) => (
          <RevisionRow key={r.id} revision={r} />
        ))}
      </ul>
    </section>
  );
}

/**
 * The cycle's net effect on what has to be found each month. Shown only when every part of
 * it is known - a total with the unknowns dropped would read as a fact (ADR-0006).
 */
function NetEffect({ data }: { data: { netMonthlyEffect: string | null; effectComplete: boolean; revisions: unknown[] } }) {
  const count = `${data.revisions.length} ${data.revisions.length === 1 ? 'change' : 'changes'}`;
  if (!data.effectComplete) {
    return <span className="text-caption text-ink-muted">{count} · effect not yet known</span>;
  }
  if (data.netMonthlyEffect == null || Number(data.netMonthlyEffect) === 0) {
    return <span className="text-caption text-ink-muted">{count} · no change to the monthly total</span>;
  }
  const more = Number(data.netMonthlyEffect) > 0;
  return (
    <span className="text-caption text-ink-muted">
      {count} ·{' '}
      <Amount value={data.netMonthlyEffect} role="caption" signed emphasiseNegative={false} className="text-ink" />
      {more ? ' more needed each month' : ' less needed each month'}
    </span>
  );
}

const HEADLINE: Record<PlanRevisionResponse['revisionType'], (name: string) => string> = {
  CREATED: (n) => `Added ${n}`,
  AMENDED: (n) => `Changed ${n}`,
  SUPERSEDED: (n) => `Changed ${n}`,
  PAUSED: (n) => `Paused ${n}`,
  RESUMED: (n) => `Restarted ${n}`,
  ENDED: (n) => `Removed ${n}`,
  SYNCED: (n) => `${n} followed its source`,
};

function RevisionRow({ revision }: { revision: PlanRevisionResponse }) {
  const href =
    revision.subjectType === 'GOAL' ? `/goals/${revision.subjectId}` : `/commitment-rules/${revision.subjectId}`;

  return (
    <li className="border-b border-line py-space-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-space-4">
        <Link to={href} className="text-row text-ink underline-offset-2 hover:underline">
          {HEADLINE[revision.revisionType](revision.subjectName)}
        </Link>
        {/* Null is unknown, never ₹0 - Amount renders an em dash for it. */}
        <Amount value={revision.monthlyEffect} role="row" signed className="shrink-0 text-ink-soft" />
      </div>

      <p className="mt-space-1 text-caption text-ink-muted">
        {formatShortDate(revision.decidedAt.slice(0, 10))}
        {/* Only worth saying when it isn't simply "now" - a change that starts later is the
            whole point of "Changes start", and silently applying it reads as a bug. */}
        {revision.effectiveFrom > revision.decidedAt.slice(0, 10) && (
          <> · from {formatDayMonthYear(revision.effectiveFrom)}</>
        )}
        {!revision.userDecision && <> · followed its loan or holding</>}
      </p>

      {revision.changes.length > 0 && (
        <ul className="mt-space-1 flex flex-col gap-space-1">
          {revision.changes.map((c) => (
            <li key={c.field} className="text-caption text-ink-soft">
              {c.label}: {renderValue(c, c.oldValue)} → {renderValue(c, c.newValue)}
            </li>
          ))}
        </ul>
      )}

      {/* The user's own words, kept in quotes so it's clearly theirs and not the product's. */}
      {revision.reason && <p className="mt-space-1 text-caption italic text-ink-soft">“{revision.reason}”</p>}
    </li>
  );
}

/**
 * The server stores every value as a string with a `valueKind` saying how to read it -
 * one column has to hold a name, a date, a flag and an amount. Formatting happens here so
 * "4200.00" renders as ₹4,200 and "2027-08-31" as 31 Aug 2027.
 */
function renderValue(change: PlanFieldChange, value: string | null): string {
  if (value == null) return '—';
  switch (change.valueKind) {
    case 'MONEY':
      return formatMoney(value);
    case 'DATE':
      return formatDayMonthYear(value);
    case 'FLAG':
      return value === 'true' ? 'yes' : 'no';
    case 'TEXT':
    case 'NUMBER':
    default:
      return value;
  }
}
