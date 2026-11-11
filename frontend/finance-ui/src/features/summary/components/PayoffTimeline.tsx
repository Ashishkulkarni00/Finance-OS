import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { DebtTrajectoryLoan, DebtTrajectoryResponse } from '@/types/review';
import { AXIS_TICK, TooltipCard, TooltipLine } from './ChartTooltip';

const MONTH_FMT = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const DEBT = 'var(--chart-debt)';

interface Row {
  name: string;
  months: number;
  end: string;
  raw: DebtTrajectoryLoan;
}

function TooltipBody({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const r = payload[0]!.payload as Row;
  return (
    <TooltipCard title={r.name}>
      <TooltipLine label="Still owed" colour={DEBT} value={r.raw.outstanding} />
      <TooltipLine label="EMI that stops" value={r.raw.emi} />
      <div className="mt-space-1 text-ink-soft">
        Last EMI <span className="num text-ink">{r.end}</span> · {r.months} {r.months === 1 ? 'month' : 'months'} from now
      </div>
    </TooltipCard>
  );
}

/**
 * When each loan ends - one bar per loan from today to its last EMI, on a shared time axis
 * (ADR-0022). The curve above says how much is owed; this answers what people plan around:
 * which EMI goes first, and when that money comes back. One series, one colour; each row's
 * name labels its bar. A loan without a rate can't be projected and is listed in words.
 */
export function PayoffTimeline({ debt }: { debt: DebtTrajectoryResponse }) {
  const now = new Date(`${debt.asOf}T00:00:00Z`);
  const monthsTo = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return Math.max(1, (d.getUTCFullYear() - now.getUTCFullYear()) * 12 + (d.getUTCMonth() - now.getUTCMonth()));
  };
  const projected = debt.loans
    .filter((l) => l.inCurve && l.payoffDate)
    .sort((a, b) => a.payoffDate!.localeCompare(b.payoffDate!));
  const unprojected = debt.loans.filter((l) => !l.inCurve || !l.payoffDate);
  const rows: Row[] = projected.map((l) => ({
    name: l.name,
    months: monthsTo(l.payoffDate!),
    end: MONTH_FMT.format(new Date(`${l.payoffDate}T00:00:00Z`)),
    raw: l,
  }));
  const monthStart = (m: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + m, 1));
  const max = Math.max(12, ...rows.map((r) => r.months));
  // A tick at each January, labelled with its year.
  const ticks: number[] = [];
  for (let m = 0; m <= max; m++) if (monthStart(m).getUTCMonth() === 0) ticks.push(m);

  return (
    <div className="flex flex-col gap-space-3">
      <span className="text-caption text-ink-muted">When each loan ends</span>
      {rows.length > 0 && (
        <div className="w-full" style={{ height: rows.length * 40 + 36 }} role="img" aria-label="Each loan as a bar from today to its last EMI. Hover a loan for what is owed and the EMI that stops.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" barCategoryGap={10} margin={{ top: 0, right: 72, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal={false} stroke="var(--line)" />
              <XAxis
                type="number"
                domain={[0, max]}
                ticks={ticks}
                tickFormatter={(m: number) => String(monthStart(m).getUTCFullYear())}
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
              />
              <YAxis type="category" dataKey="name" width={140} tickLine={false} axisLine={false} tick={{ ...AXIS_TICK, fill: 'var(--ink)' }} />
              <Tooltip content={TooltipBody} cursor={{ fill: 'var(--sunken)' }} />
              <Bar dataKey="months" fill={DEBT} maxBarSize={14} radius={[0, 4, 4, 0]}>
                <LabelList dataKey="end" position="right" style={{ fill: 'var(--ink-soft)', fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {unprojected.map((l) => (
        <p key={l.loanId} className="text-caption text-ink-muted">
          {l.name}: no rate recorded — can’t be projected.
        </p>
      ))}
    </div>
  );
}
