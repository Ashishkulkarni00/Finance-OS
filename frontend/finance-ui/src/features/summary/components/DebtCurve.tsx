import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { DebtTrajectoryPoint, DebtTrajectoryResponse } from '@/types/review';
import { AXIS_TICK, TooltipCard, TooltipLine } from './ChartTooltip';
import { compactMoney } from './viz';

const DEBT = 'var(--chart-debt)';
const LABEL = new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' });
const LONG = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });

interface Row {
  label: string;
  owed: number;
  raw: DebtTrajectoryPoint;
  /** Loans whose last EMI falls in this month. */
  clears: string[];
}

function TooltipBody({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const r = payload[0]!.payload as Row;
  return (
    <TooltipCard title={LONG.format(new Date(`${r.raw.month.slice(0, 10)}T00:00:00Z`))}>
      <TooltipLine label="Still owed" colour={DEBT} value={r.raw.outstanding} strong={false} />
      {r.raw.principalDue && <TooltipLine label="Principal paid this month" value={r.raw.principalDue} />}
      {r.raw.interestDue && <TooltipLine label="Interest this month" value={r.raw.interestDue} />}
      {r.clears.length > 0 && <div className="mt-space-1 text-positive">{r.clears.join(', ')} cleared</div>}
    </TooltipCard>
  );
}

/**
 * Everything owed, walked forward to the month the last loan clears (ADR-0022). An area, not
 * columns: a balance exists on every day between two EMIs. Clay, never red - debt being
 * worked down is not an emergency (DESIGN_SYSTEM §7). Each loan's payoff is a dot on the line;
 * hovering any month gives what's owed then, that month's principal and interest, and any
 * loan that clears in it.
 */
export function DebtCurve({ debt }: { debt: DebtTrajectoryResponse }) {
  const clearsIn = new Map<string, string[]>();
  for (const loan of debt.loans) {
    if (!loan.inCurve || !loan.payoffDate) continue;
    const key = loan.payoffDate.slice(0, 7);
    clearsIn.set(key, [...(clearsIn.get(key) ?? []), loan.name]);
  }
  const rows: Row[] = debt.points.map((p) => ({
    label: LABEL.format(new Date(`${p.month.slice(0, 10)}T00:00:00Z`)),
    owed: Number(p.outstanding),
    raw: p,
    clears: clearsIn.get(p.month.slice(0, 7)) ?? [],
  }));

  return (
    <div className="h-[280px] w-full" role="img" aria-label="Total still owed across every loan, month by month until the last one clears. Payoff months are marked; hover a month for its figures.">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} interval="preserveStartEnd" minTickGap={40} />
          <YAxis width={56} tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={(v: number) => compactMoney(String(v))} />
          <Tooltip content={TooltipBody} cursor={{ stroke: 'var(--border)' }} />
          <Area type="monotone" dataKey="owed" stroke={DEBT} strokeWidth={1.5} fill={DEBT} fillOpacity={0.1} activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }} />
          {rows
            .filter((r) => r.clears.length > 0)
            .map((r) => (
              <ReferenceDot key={r.label} x={r.label} y={r.owed} r={5} fill={DEBT} stroke="var(--surface)" strokeWidth={1.5} />
            ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
