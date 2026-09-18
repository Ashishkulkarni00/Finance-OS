import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { FormRow, FORM_ROW_CONTROL } from '@/components/FormRow';
import { formatMoney } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import { useEstimateLoanMutation } from '@/services/loanService';
import type { LoanEstimateRequest, LoanEstimateResponse } from '@/types/loan';
import { LOAN_FIELD_HINT } from '../loanHelp';

/** Fields the server can work out, and so pre-fill. */
const TARGETS = ['originalFirstEmiDate', 'emi', 'outstanding', 'emisRemaining', 'firstEmiDate'] as const;
type Target = (typeof TARGETS)[number];
type Filled = Partial<Record<Target, string>>;

const MONEY = /^\d+(\.\d{1,2})?$/;
const RATE = /^\d+(\.\d{1,3})?$/;
const WHOLE = /^\d+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const DESCRIBE: Record<Target, (v: string) => string> = {
  originalFirstEmiDate: (v) => `first EMI ${formatShortDate(v)}`,
  emi: (v) => `EMI ${formatMoney(v)}`,
  outstanding: (v) => `outstanding ${formatMoney(v)}`,
  emisRemaining: (v) => `${v} EMIs left`,
  firstEmiDate: (v) => `next EMI ${formatShortDate(v)}`,
};

/** "6145" and "6145.00" are the same entry - a comparison, not arithmetic. */
function same(field: Target, a?: string, b?: string) {
  if (!a || !b) return (a ?? '') === (b ?? '');
  return field === 'emi' || field === 'outstanding' || field === 'emisRemaining' ? Number(a) === Number(b) : a === b;
}

function fromEstimate(r: LoanEstimateResponse): Filled {
  return {
    originalFirstEmiDate: r.originalFirstEmiDate ?? undefined,
    emi: r.emi ?? undefined,
    outstanding: r.outstandingBalance ?? undefined,
    emisRemaining: r.emisRemaining != null ? String(r.emisRemaining) : undefined,
    firstEmiDate: r.nextEmiDate ?? undefined,
  };
}

function CalculatedTag() {
  return (
    <span className="shrink-0 rounded-sm bg-sunken px-space-1 text-micro text-ink-muted" title="Worked out for you - change it if yours differs">
      calculated
    </span>
  );
}

interface LoanStateFieldsProps {
  // Typed loosely so both sheets' fuller form types can pass their form in.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  today: string;
}

/**
 * The loan's terms, then where it stands today - with everything that can be worked out
 * filled in for the user.
 *
 * <p><strong>How pre-filling works.</strong> The server (POST /loans/estimate) works out
 * the first EMI from the disbursal date, the EMI from amount/rate/tenure, and from those
 * the EMIs gone out, EMIs left, next EMI and outstanding principal as of the chosen date.
 * Or, with no original terms, EMIs left or the EMI from today's figures. The form does no
 * money arithmetic itself.
 *
 * <p>A field is filled automatically while it's empty or still holds the value last filled
 * in, and is marked "calculated". Once the user types their own value it's theirs: it's
 * never overwritten, and it's sent to the estimate as a known figure. If the calculation
 * then disagrees with it, a line offers the calculated values instead of silently
 * replacing them - which is also what an existing loan sees on Edit, where every stored
 * value counts as the user's.
 */
export function LoanStateFields({ form, today }: LoanStateFieldsProps) {
  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form;
  const [estimate] = useEstimateLoanMutation();
  const autoRef = useRef<Filled>({});
  const [auto, setAuto] = useState<Filled>({});
  const [suggestion, setSuggestion] = useState<Filled | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [result, setResult] = useState<LoanEstimateResponse | null>(null);

  const values = watch();
  const isAuto = (f: Target) => auto[f] !== undefined && same(f, values[f], auto[f]);
  const userSet = (f: Target) => !!values[f] && !(autoRef.current[f] !== undefined && same(f, values[f], autoRef.current[f]));

  const valid = (v: string | undefined, re: RegExp) => (v && re.test(v) ? v : null);
  const request: LoanEstimateRequest = {
    principal: valid(values.principal, MONEY),
    annualRate: valid(values.annualRate, RATE) != null ? Number(values.annualRate) : null,
    tenureMonths: valid(values.tenureMonths, WHOLE) != null && Number(values.tenureMonths) > 0 ? Number(values.tenureMonths) : null,
    startDate: valid(values.startDate, DATE),
    originalFirstEmiDate: userSet('originalFirstEmiDate') ? valid(values.originalFirstEmiDate, DATE) : null,
    emi: userSet('emi') && Number(values.emi) > 0 ? valid(values.emi, MONEY) : null,
    outstandingBalance: userSet('outstanding') ? valid(values.outstanding, MONEY) : null,
    emisRemaining: userSet('emisRemaining') && valid(values.emisRemaining, WHOLE) != null ? Number(values.emisRemaining) : null,
    emiDay: userSet('firstEmiDate') && valid(values.firstEmiDate, DATE) ? Number(values.firstEmiDate.slice(8, 10)) : null,
    asOf: valid(values.balanceAsOf, DATE),
  };
  const requestKey = JSON.stringify(request);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const r = await estimate(request).unwrap();
        const calculated = fromEstimate(r);
        const current = getValues();
        const nextAuto: Filled = { ...autoRef.current };
        const differing: Filled = {};
        for (const f of TARGETS) {
          const v = calculated[f];
          if (v === undefined) continue;
          const stillOurs = autoRef.current[f] !== undefined && same(f, current[f], autoRef.current[f]);
          if (!current[f] || stillOurs) {
            if (!same(f, current[f], v)) setValue(f, v, { shouldValidate: !!current[f] });
            nextAuto[f] = v;
          } else if (!same(f, current[f], v)) {
            differing[f] = v;
          }
        }
        autoRef.current = nextAuto;
        setAuto(nextAuto);
        setSuggestion(Object.keys(differing).length > 0 ? differing : null);
        setResult(r);
      } catch {
        // A convenience: the form works the same without it.
      }
    }, 350);
    return () => clearTimeout(timer);
    // The request key captures every input that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const suggestionKey = suggestion ? JSON.stringify(suggestion) : null;
  const applySuggestion = () => {
    if (!suggestion) return;
    const nextAuto = { ...autoRef.current };
    for (const f of TARGETS) {
      const v = suggestion[f];
      if (v === undefined) continue;
      setValue(f, v, { shouldValidate: true, shouldDirty: true });
      nextAuto[f] = v;
    }
    autoRef.current = nextAuto;
    setAuto(nextAuto);
    setSuggestion(null);
  };

  const tag = (f: Target) => (isAuto(f) ? <CalculatedTag /> : null);
  const showEmiWarning = result?.emiDiffersFromTerms && result.standardEmi && userSet('emi');

  return (
    <>
      <div>
        <p className="mb-space-1 text-micro uppercase tracking-[0.08em] text-ink-muted">Loan terms</p>
        <p className="mb-space-2 text-caption text-ink-soft">
          From your sanction letter. Fill what you know — the rest is worked out for you.
        </p>
        <div className="rounded-lg border border-line">
          <FormRow label="Loan amount" error={errors.principal?.message as string | undefined} hint={LOAN_FIELD_HINT.principal}>
            <span className="flex items-center gap-space-1">
              <span className="num text-ink-muted">₹</span>
              <input {...register('principal')} inputMode="decimal" placeholder="Sanctioned amount" className={FORM_ROW_CONTROL + ' num'} />
            </span>
          </FormRow>

          <FormRow label="Interest" error={errors.annualRate?.message as string | undefined} hint={LOAN_FIELD_HINT.rate}>
            <span className="flex items-center gap-space-2">
              <input {...register('annualRate')} inputMode="decimal" placeholder="Blank if you don't know" className={FORM_ROW_CONTROL + ' num'} />
              <span className="shrink-0 text-caption text-ink-muted">% a year</span>
            </span>
          </FormRow>

          <FormRow label="Tenure" error={errors.tenureMonths?.message as string | undefined} hint={LOAN_FIELD_HINT.tenure}>
            <span className="flex items-center gap-space-2">
              <input {...register('tenureMonths')} inputMode="numeric" placeholder="60" className="w-14 bg-transparent text-label text-ink outline-none num" />
              <span className="text-caption text-ink-muted">months</span>
            </span>
          </FormRow>

          <FormRow label="Disbursed on" error={errors.startDate?.message as string | undefined} hint={LOAN_FIELD_HINT.startDate}>
            <input type="date" {...register('startDate')} max={today} className={FORM_ROW_CONTROL + ' cursor-pointer'} />
          </FormRow>

          <FormRow
            label="First EMI"
            error={errors.originalFirstEmiDate?.message as string | undefined}
            hint={LOAN_FIELD_HINT.originalFirstEmiDate}
          >
            <span className="flex items-center gap-space-2">
              <input type="date" {...register('originalFirstEmiDate')} className={FORM_ROW_CONTROL + ' cursor-pointer'} />
              {tag('originalFirstEmiDate')}
            </span>
          </FormRow>

          <FormRow label="EMI" error={errors.emi?.message as string | undefined} hint={LOAN_FIELD_HINT.emi}>
            <span className="flex items-center gap-space-2">
              <span className="num text-ink-muted">₹</span>
              <input {...register('emi')} inputMode="decimal" placeholder="Monthly instalment" className={FORM_ROW_CONTROL + ' num'} />
              {tag('emi')}
            </span>
          </FormRow>
        </div>
        {showEmiWarning && (
          <p className="num mt-space-2 text-caption text-attention">
            For this amount, rate and tenure the EMI works out to {formatMoney(result.standardEmi)}. If {formatMoney(values.emi)} is
            right, the rate or tenure is probably different.
          </p>
        )}
      </div>

      <div>
        <p className="mb-space-1 text-micro uppercase tracking-[0.08em] text-ink-muted">Where it stands</p>
        <p className="mb-space-2 text-caption text-ink-soft">
          Worked out from the terms above. Change anything that differs from your latest statement.
        </p>

        {suggestion && suggestionKey !== dismissed && (
          <div className="mb-space-2 flex flex-wrap items-center justify-between gap-space-2 rounded-md bg-sunken px-space-3 py-space-2">
            <p className="num text-caption text-ink-soft">
              From the terms: {TARGETS.filter((f) => suggestion[f] !== undefined).map((f) => DESCRIBE[f](suggestion[f]!)).join(' · ')}
            </p>
            <span className="flex gap-space-3">
              <button type="button" onClick={() => setDismissed(suggestionKey)} className="text-caption text-ink-muted hover:text-ink">
                Keep mine
              </button>
              <button type="button" onClick={applySuggestion} className="text-caption font-semibold text-accent hover:underline">
                Use these
              </button>
            </span>
          </div>
        )}

        <div className="rounded-lg border border-line">
          <FormRow label="Outstanding" error={errors.outstanding?.message as string | undefined} hint={LOAN_FIELD_HINT.outstanding}>
            <span className="flex items-center gap-space-2">
              <span className="num text-ink-muted">₹</span>
              <input {...register('outstanding')} inputMode="decimal" placeholder="Principal outstanding" className={FORM_ROW_CONTROL + ' num'} />
              {tag('outstanding')}
            </span>
          </FormRow>

          <FormRow label="As of" error={errors.balanceAsOf?.message as string | undefined} hint={LOAN_FIELD_HINT.balanceAsOf}>
            <input type="date" {...register('balanceAsOf')} max={today} className={FORM_ROW_CONTROL + ' cursor-pointer'} />
          </FormRow>

          <FormRow label="EMIs left" error={errors.emisRemaining?.message as string | undefined} hint={LOAN_FIELD_HINT.emisRemaining}>
            <span className="flex items-center gap-space-2">
              <input {...register('emisRemaining')} inputMode="numeric" placeholder="—" className="w-14 bg-transparent text-label text-ink outline-none num" />
              {tag('emisRemaining')}
            </span>
          </FormRow>

          <FormRow label="Next EMI" error={errors.firstEmiDate?.message as string | undefined} hint={LOAN_FIELD_HINT.nextEmi}>
            <span className="flex items-center gap-space-2">
              <input type="date" {...register('firstEmiDate')} className={FORM_ROW_CONTROL + ' cursor-pointer'} />
              {tag('firstEmiDate')}
            </span>
          </FormRow>
        </div>
        {result?.lastEmiDate && (
          <p className="mt-space-2 text-caption text-ink-muted">
            Last EMI on {formatShortDate(result.lastEmiDate)}
            {result.emisPaid != null && result.emisPaid > 0 ? ` · ${result.emisPaid} EMIs paid so far` : ''}.
          </p>
        )}
      </div>
    </>
  );
}
