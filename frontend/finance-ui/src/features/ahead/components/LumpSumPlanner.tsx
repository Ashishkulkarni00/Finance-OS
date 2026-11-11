import { useEffect, useState } from 'react';
import { Amount } from '@/components/Amount';
import { GroupBand } from '@/components/GroupBand';
import { Disclosure } from '@/components/Disclosure';
import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/lib/cn';
import { useGetLumpSumQuery } from '@/services/decisionService';
import type { LumpSumOption } from '@/types/decision';
import type { GoalFeasibilityState } from '@/types/goal';

const DEBOUNCE_MS = 400;
const VALID = /^\d+(\.\d{1,2})?$/;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const months = (m: number | null) => (m == null ? '—' : `${m} ${m === 1 ? 'month' : 'months'}`);

const VERDICT: Record<GoalFeasibilityState, string> = {
  COVERED_BY_PLAN: 'on plan',
  FITS: 'fits',
  FITS_IF: 'fits if…',
  DOES_NOT_FIT: 'doesn’t fit',
  UNKNOWN: 'can’t tell',
};

function Row({ name, detail, sub, figure }: { name: string; detail?: React.ReactNode; sub?: string | null; figure?: React.ReactNode }) {
  return (
    <li className="flex items-baseline justify-between gap-space-3 border-b border-line py-space-2 last:border-b-0">
      <span className="min-w-0 text-label text-ink">
        {name}
        {detail && <span className="block text-caption text-ink-soft">{detail}</span>}
        {sub && <span className="block text-caption text-ink-muted">{sub}</span>}
      </span>
      {figure}
    </li>
  );
}

function prepayRow(o: LumpSumOption, runwayBefore: number | null) {
  const rate = o.annualRate != null ? ` · ${o.annualRate}%` : '';
  if (o.unknownReason || o.interestSaved == null) {
    return <Row key={`p${o.targetId}`} name={`${o.targetName}${rate}`} sub={o.unknownReason} figure={<Amount value={null} role="row" />} />;
  }
  const what = o.closesLoan
    ? `Clears it outright — ${o.emiFreed ? 'its EMI stops leaving every month' : 'nothing left to pay'}`
    : `Ends ${plural(o.clearsMonthsSooner ?? 0, 'month')} sooner, same EMI`;
  const runway =
    o.runwayMonthsAfter != null && runwayBefore != null && o.runwayMonthsAfter !== runwayBefore
      ? `Reachable money then covers ${months(o.runwayMonthsAfter)} of must-pay bills, from ${months(runwayBefore)}.`
      : null;
  return (
    <Row
      key={`p${o.targetId}`}
      name={`${o.targetName}${rate}`}
      detail={o.closesLoan ? <>{what} · uses <Amount value={o.applied} role="caption" /></> : what}
      sub={runway}
      figure={
        <span className="flex shrink-0 flex-col items-end">
          <Amount value={o.interestSaved} role="row" className="text-positive" />
          <span className="text-caption text-ink-muted">interest saved</span>
        </span>
      }
    />
  );
}

function goalRow(o: LumpSumOption) {
  const moved = o.goalBefore && o.goalAfter && o.goalBefore !== o.goalAfter;
  return (
    <Row
      key={`g${o.targetId}`}
      name={o.targetName}
      detail={
        o.goalBefore && o.goalAfter ? (
          <>
            {moved ? (
              <>
                From <span className="text-ink-muted">{VERDICT[o.goalBefore]}</span> to{' '}
                <span className={cn(o.goalAfter === 'FITS' || o.goalAfter === 'COVERED_BY_PLAN' ? 'text-positive' : 'text-ink')}>
                  {VERDICT[o.goalAfter]}
                </span>
              </>
            ) : (
              <>Still {VERDICT[o.goalAfter]}</>
            )}
            {' · '}uses <Amount value={o.applied} role="caption" />
          </>
        ) : undefined
      }
      sub={o.goalAfterReason}
    />
  );
}

/**
 * The ₹50,000 question — ROADMAP 4.3. A bonus lands: prepay a loan, put it towards a goal, or
 * keep it?
 *
 * <p>Three registers, each in its own unit, never one ranking: interest saved, a goal's
 * verdict, months of runway. Choosing between "saves ₹8,000" and "the trip now fits" is a
 * judgement about a life, so the screen lays the trade out and stops.
 *
 * <p><strong>Investing gets a bar, not a figure.</strong> Any projected return would be a
 * guess dressed as a number. What is certain is the rate it would have to beat — the dearest
 * loan's — and that is all the server states.
 */
export function LumpSumPlanner() {
  const [raw, setRaw] = useState('');
  const [settled, setSettled] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setSettled(raw.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [raw]);

  const usable = VALID.test(settled) && Number(settled) > 0;
  const { data, isFetching, isError } = useGetLumpSumQuery(settled, { skip: !usable });
  const fresh = data && Number(data.amount) === Number(settled);

  const prepay = fresh ? data.options.filter((o) => o.kind === 'PREPAY') : [];
  const goals = fresh ? data.options.filter((o) => o.kind === 'GOAL') : [];

  return (
    <Disclosure storageKey="kosh.goals.lumpsum" label="Got a lump sum?" summary="a bonus, a refund, a gift - see what it would do">
      <p className="mb-space-3 max-w-[40rem] text-caption text-ink-muted">
        A bonus, a refund, a gift. Type the amount to see what it would do on each loan, each goal, or kept — side by side,
        nothing moved.
      </p>
      <label className="flex h-9 pointer-coarse:h-11 w-48 items-center gap-space-1 rounded-lg border border-border bg-surface px-space-3 focus-within:border-accent">
        <span aria-hidden className="num text-label text-ink-muted">
          ₹
        </span>
        <input
          inputMode="decimal"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          aria-label="Lump sum amount"
          placeholder="50000"
          className="num w-full bg-transparent text-label text-ink outline-none"
        />
      </label>

      {usable && isError && <p className="mt-space-3 text-caption text-ink-muted">Couldn’t work this out just now.</p>}
      {usable && !isError && (isFetching || !fresh) && <Skeleton className="mt-space-4 h-32 w-full" />}

      {usable && fresh && !isFetching && (
        <div className="mt-space-5 flex flex-col gap-space-4">
          {prepay.length > 0 && (
            <div>
              <GroupBand label="Prepay a loan" count={prepay.length} />
              <ul className="flex flex-col">{prepay.map((o) => prepayRow(o, data.runwayMonthsBefore))}</ul>
              <p className="mt-space-1 text-caption text-ink-muted">
                Assumes the EMI stays the same and the loan ends sooner. Some lenders lower the EMI instead, or charge for
                prepaying — check before you pay.
              </p>
            </div>
          )}
          {goals.length > 0 && (
            <div>
              <GroupBand label="Put it towards a goal" count={goals.length} />
              <ul className="flex flex-col">{goals.map(goalRow)}</ul>
              <p className="mt-space-1 text-caption text-ink-muted">Money in a goal stays in your own accounts, so it is still there in an emergency.</p>
            </div>
          )}
          <div>
            <GroupBand label="Or keep it" />
            <p className="px-space-3 text-caption text-ink-soft">
              {data.runwayMonthsBefore != null
                ? `Kept, your reachable money covers ${months(data.runwayMonthsBefore)} of must-pay bills — the cushion prepaying would spend.`
                : 'Kept, it stays your cushion.'}{' '}
              {data.breakEvenRate != null && (
                <>
                  To do better by investing it, a return would have to beat{' '}
                  <span className="num text-ink">{data.breakEvenRate}%</span> a year — {data.breakEvenLoan}’s rate — after tax
                  and with certainty. Prepaying earns that rate risk-free.
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </Disclosure>
  );
}
