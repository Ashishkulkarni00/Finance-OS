import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { useGetAffordabilityQuery } from '@/services/decisionService';
import { formatMoney } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import { cn } from '@/lib/cn';

/** Long enough that typing "12000" asks once, not five times. */
const DEBOUNCE_MS = 400;

/** Matches the server's own guard: a positive amount with at most two decimal places. */
const VALID = /^\d+(\.\d{1,2})?$/;

/**
 * **What this spend would cost** — the decision engine's first appearance, under the amount
 * you are typing (ROADMAP 4.2).
 *
 * <p>Every other money app can tell you afterwards what you spent. The thing this product
 * exists to say is what a choice costs *before* it is made — and the only moment that is
 * worth anything is while the number is still being typed. Putting it on a screen you have
 * to go and find would make it a report, which is the category this product is explicitly
 * not in.
 *
 * <p><strong>Nothing is computed here.</strong> Both figures, the comparison between them
 * and the name of whatever breaks all arrive worked out from `/decisions/afford`
 * (FRONTEND_CONVENTIONS §4 rule 2). This file debounces, words and tones.
 *
 * <p><strong>It states a consequence and never a verdict.</strong> There is no "you can't
 * afford this": the product does not know that, and would be making a judgement about
 * someone's life from a column of numbers (DESIGN_SYSTEM §12 rule 8). It says what the day
 * rate becomes, and names the dated payment that stops being covered. Amber appears only
 * when something concrete breaks — a tighter month is a fact, not a warning, and colouring
 * it would teach the eye to skip the colour when it matters.
 *
 * <p><strong>Silent until it has something true to say.</strong> No amount, no account, an
 * unparsable amount, or a request still in flight — all render nothing. A line that flickers
 * in and out under a field being typed into is worse than no line at all.
 */
export function AffordNote({ amount, accountId }: { amount: string | undefined; accountId: number | undefined }) {
  const [settled, setSettled] = useState<string>('');

  // The amount only reaches the query once it has stopped changing. Without this the
  // endpoint is hit on every keystroke, and the answer to a half-typed "1" is noise that
  // the reader has to learn to ignore.
  useEffect(() => {
    const trimmed = (amount ?? '').trim();
    const id = setTimeout(() => setSettled(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [amount]);

  const usable = VALID.test(settled) && Number(settled) > 0 && accountId != null;
  const { data, isFetching, isError } = useGetAffordabilityQuery(
    { amount: settled, accountId: accountId as number },
    { skip: !usable },
  );

  // **Silence on failure would be a lie by omission.** If this cannot be checked, an empty
  // space under the amount reads exactly like "nothing to worry about" - so someone about
  // to spend money that breaks a bill would take the absence as reassurance. Saying so
  // costs one quiet line and is the same refusal the rest of the product makes: missing
  // data says it is missing, it never renders as fine (CLAUDE.md rule 3).
  if (usable && isError) {
    return <Note muted>Couldn&rsquo;t check what this would cost just now.</Note>;
  }

  // Stale data from a previous amount is worse than nothing: it would state a consequence
  // for a figure the user is no longer looking at.
  //
  // Compared as numbers, not as strings. The server normalises money to two decimals, so
  // typing "9000" comes back as "9000.00" - and a string comparison here never matched,
  // which silently suppressed the whole note on every amount that wasn't typed with its
  // paise. A guard that can only ever fail closed is worse than no guard: it fails
  // invisibly, and looks exactly like the feature not being wired up.
  const stale = data != null && Number(data.amount) !== Number(settled);
  if (!usable || !data || isFetching || stale) {
    return null;
  }

  if (data.state === 'INCOMPLETE') {
    return <Note muted>{data.reason}</Note>;
  }

  if (data.state === 'EXCEEDS_ACCOUNT') {
    return (
      <Note attention>
        {data.accountName} holds {formatMoney(data.accountBalanceBefore)}, so this is more than is in it today.
      </Note>
    );
  }

  if (data.state === 'SHORTFALL') {
    return (
      <Note attention>
        Leaves <Amount value={data.perDayAfter} role="caption" /> a day for {data.daysToSalary}{' '}
        {data.daysToSalary === 1 ? 'day' : 'days'} &mdash; and {data.accountName} then can&rsquo;t cover{' '}
        <span className="text-ink">{data.shortfallName}</span>
        {data.shortfallOn && <> on {formatShortDate(data.shortfallOn)}</>}, {formatMoney(data.shortBy)} short.
      </Note>
    );
  }

  // FITS and TIGHTENS say the same kind of thing; only TIGHTENS is worth the words "down
  // from", because below a third of the day rate the comparison is noise.
  return (
    <Note>
      Leaves <Amount value={data.perDayAfter} role="caption" className="text-ink" /> a day for {data.daysToSalary}{' '}
      {data.daysToSalary === 1 ? 'day' : 'days'}
      {data.state === 'TIGHTENS' && <>, down from {formatMoney(data.perDayBefore)}</>}.
    </Note>
  );
}

/** One quiet line under the amount. Amber only where something concrete breaks. */
function Note({
  children,
  attention,
  muted,
}: {
  children: React.ReactNode;
  attention?: boolean;
  muted?: boolean;
}) {
  return (
    <p
      className={cn(
        'reveal flex max-w-[22rem] items-start justify-center gap-space-1 text-center text-caption',
        attention ? 'text-attention' : muted ? 'text-ink-muted' : 'text-ink-soft',
      )}
    >
      {attention && <AlertTriangle size={13} strokeWidth={1.5} className="mt-[0.15rem] shrink-0" aria-hidden />}
      <span>{children}</span>
    </p>
  );
}
