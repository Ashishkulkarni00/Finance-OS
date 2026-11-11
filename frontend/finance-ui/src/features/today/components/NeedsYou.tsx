import { CheckCircle2, Undo2 } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { LedgerRow } from '@/components/LedgerRow';
import { RowMark } from '@/components/RowMark';
import { SectionRule } from '@/components/SectionRule';
import { useInsightAction } from '@/components/InsightList';
import { formatSalaryDate } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { useGetRecoveryQuery } from '@/services/recoveryService';
import type { InsightItem } from '@/types/insight';
import type { FinancialStateResponse } from '@/types/financialState';
import type { RecoveryStep } from '@/types/recovery';

/** Most rows shown before the rest fold into one "more" row that opens the panel. */
const SHOWN = 3;

const STEP_VERB: Record<RecoveryStep['kind'], string> = {
  DEFER: 'Let it wait:',
  RELEASE: 'Borrow back from',
  SPEND_LESS: 'Spend a little less',
};

/**
 * One thing that needs the person. Tapping runs its action - except a `CONFIRM`, which writes
 * the moment it is called: a tap on a row must never write, so that one (and a row with no
 * action) opens the Needs-you panel, where the explicit button is.
 */
function NeedsRow({ item, onOpen }: { item: InsightItem; onOpen: () => void }) {
  const { act } = useInsightAction(item);
  const runs = item.action != null && item.action.kind !== 'CONFIRM';
  return (
    <LedgerRow
      onClick={runs ? act : onOpen}
      leading={<RowMark tone={item.severity === 'CRITICAL' ? 'critical' : 'attention'} />}
      primary={item.title}
      wrapPrimary
      richSecondary
      secondary={
        <>
          <span className="line-clamp-2">{item.explanation}</span>
          {runs && <span className="block text-accent">{item.action!.label}</span>}
        </>
      }
      amount={item.impact ? <Amount value={item.impact} role="row" className="text-ink" /> : null}
    />
  );
}

/** A lever from the recovery plan: shown as a row, but nothing here moves money, so it isn't a button. */
function StepRow({ step, index, total }: { step: RecoveryStep; index: number; total: number }) {
  const name =
    step.kind === 'SPEND_LESS' && step.perDayLess ? (
      <>
        Spend about <Amount value={step.perDayLess} role="row" className="text-ink" /> a day less
      </>
    ) : (
      `${STEP_VERB[step.kind]} ${step.label}`
    );
  return (
    <div className="flex items-center gap-space-3 border-b border-line py-space-3 last:border-b-0">
      <RowMark tone="neutral" icon={Undo2} />
      <div className="min-w-0 flex-1 text-row text-ink">
        {total > 1 && <span className="text-ink-muted">{index + 1}. </span>}
        {name}
      </div>
      <Amount value={step.amount} role="row" className="shrink-0 text-ink" />
    </div>
  );
}

/**
 * Today's "Needs you" - TODAY_HERO_SPEC section 4.3. The ledger's own row shape, not a tinted
 * band: the same items, said once, in the same place a transaction would be.
 *
 * <p>**Loud only when it matters.** With nothing to do there is no header, just a tick and the
 * reason it is clear - a reason is more satisfying than a compliment, and it is still true the
 * day it stops being clear (rule 8: never judge, in either direction).
 *
 * <p>The count here is the count on the nav badge: every CRITICAL/ATTENTION item, including the
 * dated shortfall that Before payday also flags on its row. The row only flags it; the words and
 * the button live here.
 *
 * <p>The recovery plan ("way back") folds in as lever rows after the items. A month that is only
 * stretched has already been said in the hero's second line, so it adds nothing here.
 */
export function NeedsYou({
  needs,
  state,
  whatMoved,
  onOpen,
}: {
  needs: InsightItem[];
  state: FinancialStateResponse;
  /** The server's "what went right" lines, which it withholds whenever anything is urgent. */
  whatMoved: string[] | undefined;
  onOpen: () => void;
}) {
  const { data: recovery } = useGetRecoveryQuery();
  const levers =
    recovery && recovery.state !== 'ON_COURSE' && recovery.state !== 'INCOMPLETE'
      ? recovery.state === 'BROKEN' || recovery.steps.some((s) => s.kind !== 'SPEND_LESS')
        ? recovery.steps
        : []
      : [];

  if (needs.length === 0 && levers.length === 0) {
    const salaryOn = formatSalaryDate(state.cycle.endDate);
    // Every claim here is one the absence of an insight actually supports: no SHORTFALL means no
    // account is projected short, no NEEDS_AMOUNT means nothing is unpriced. Where the shape still
    // reports an unpriced bill, the specific sentence would be a guess, so it falls back to the one
    // that is always true.
    const everythingPriced = state.shape.unknownAmountCount === 0;
    return (
      <div className="flex items-start gap-space-3">
        <CheckCircle2 size={16} strokeWidth={1.5} className="mt-[3px] shrink-0 text-positive" aria-hidden />
        <div className="flex min-w-0 flex-col gap-space-1">
          <p className="text-body text-ink">Nothing needs you today.</p>
          <p className="text-caption text-ink-muted">
            {everythingPriced
              ? `Every payment due before ${salaryOn} has an amount, and the account it leaves from covers it.`
              : 'Nothing is overdue, short or waiting on a decision.'}
          </p>
          {whatMoved?.map((line) => (
            <p key={line} className="text-caption text-ink-muted">
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  const rest = needs.length - SHOWN;
  return (
    <section>
      <SectionRule trailing={needs.length > 0 ? needs.length : undefined}>
        {needs.length > 0 ? 'Needs you' : recovery?.state === 'BROKEN' ? 'A way back this month' : 'Running tighter than usual'}
      </SectionRule>
      {levers.length > 0 && recovery && (
        <p className={cn('pb-space-2 text-caption', recovery.state === 'BROKEN' ? 'text-attention' : 'text-ink-soft')}>
          {recovery.reason}
        </p>
      )}
      <div className="flex flex-col">
        {needs.slice(0, SHOWN).map((item) => (
          <NeedsRow key={item.key} item={item} onOpen={onOpen} />
        ))}
        {rest > 0 && (
          <button
            type="button"
            onClick={onOpen}
            aria-haspopup="dialog"
            className="border-b border-line py-space-3 text-left text-caption text-accent last:border-b-0"
          >
            {rest} more in Needs you →
          </button>
        )}
        {levers.map((s, i) => (
          <StepRow key={`${s.kind}-${s.refId ?? i}`} step={s} index={i} total={levers.length} />
        ))}
      </div>
    </section>
  );
}
