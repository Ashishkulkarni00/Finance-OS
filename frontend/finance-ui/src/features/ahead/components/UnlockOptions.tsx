import { Amount } from '@/components/Amount';
import { GroupBand } from '@/components/GroupBand';
import { Skeleton } from '@/components/Skeleton';
import { useGetUnlockOptionsQuery } from '@/services/decisionService';
import type { UnlockOption } from '@/types/decision';

/** "March 2027" - a goal lands in a month, not on a day this projection can promise. */
function monthYear(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso.slice(0, 10)}T00:00:00Z`),
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function Row({ name, detail, reason, figure }: { name: string; detail?: string; reason?: string | null; figure?: React.ReactNode }) {
  return (
    <li className="flex items-baseline justify-between gap-space-3 border-b border-line py-space-2 last:border-b-0">
      <span className="min-w-0 text-label text-ink">
        {name}
        {detail && <span className="block text-caption text-ink-soft">{detail}</span>}
        {reason && <span className="block text-caption text-ink-muted">{reason}</span>}
      </span>
      {figure}
    </li>
  );
}

function loanRow(o: UnlockOption) {
  if (o.interestSaved == null || o.clearsMonthsSooner == null) {
    return <Row key={`l${o.targetId}`} name={o.targetName} reason={o.unknownReason} figure={<Amount value={null} role="row" />} />;
  }
  return (
    <Row
      key={`l${o.targetId}`}
      name={o.targetName}
      detail={o.clearsMonthsSooner > 0 ? `Clears ${plural(o.clearsMonthsSooner, 'month')} sooner` : 'Clears in the same month'}
      // Saved interest, labelled as such: a bare green figure beside a loan reads as a payment.
      figure={
        <span className="flex shrink-0 flex-col items-end">
          <Amount value={o.interestSaved} role="row" className="text-positive" />
          <span className="text-caption text-ink-muted">interest saved</span>
        </span>
      }
    />
  );
}

function goalRow(o: UnlockOption) {
  const detail =
    o.reachesOn == null
      ? undefined
      : o.reachesMonthsSooner != null && o.reachesMonthsSooner > 0
        ? `Reached by ${monthYear(o.reachesOn)} — ${plural(o.reachesMonthsSooner, 'month')} sooner`
        : `Reached by ${monthYear(o.reachesOn)}`;
  return <Row key={`g${o.targetId}`} name={o.targetName} detail={detail} reason={o.unknownReason} />;
}

/**
 * What freed-up money could do — ROADMAP 4.4. Turns "₹2,648 frees up in February" from a
 * notification into a decision.
 *
 * <p><strong>Two registers, never one ranking.</strong> Loans are ordered by interest saved
 * and goals by when they land, each by the server. Merging them would need an exchange rate
 * between rupees saved and a goal arriving sooner, and that rate is the reader's, not ours.
 * Nothing here is marked "recommended" for the same reason.
 *
 * <p>Keeping it is offered last and plainly — it is a real choice, not the lazy one — but the
 * line beside it says what happens to unassigned money, because that is the true cost.
 */
export function UnlockOptions({ amount, startsOn }: { amount: string; startsOn: string }) {
  const { data, isLoading, isError } = useGetUnlockOptionsQuery({ amount, startsOn });

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  // Said, not hidden: an empty space here would read as "nothing to decide".
  if (isError || !data) return <p className="text-caption text-ink-muted">Couldn’t work out the options just now.</p>;

  const loans = data.filter((o) => o.kind === 'LOAN');
  const goals = data.filter((o) => o.kind === 'GOAL');

  return (
    <div className="flex flex-col gap-space-4">
      {loans.length > 0 && (
        <div>
          <GroupBand label="Add it to a loan" count={loans.length} />
          <ul className="flex flex-col">{loans.map(loanRow)}</ul>
        </div>
      )}
      {goals.length > 0 && (
        <div>
          <GroupBand label="Put it towards a goal" count={goals.length} />
          <ul className="flex flex-col">{goals.map(goalRow)}</ul>
        </div>
      )}
      <div>
        <GroupBand label="Or keep it" />
        <p className="px-space-3 text-caption text-ink-soft">
          It becomes day-to-day room. Fine if that is the plan — but unassigned money tends to get spent without being chosen.
        </p>
      </div>
    </div>
  );
}
