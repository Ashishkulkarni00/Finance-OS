import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { cycleMonthName } from '@/lib/dates';
import type { Money } from '@/lib/money';
import type { ReviewMonth } from '@/types/review';
import { AXIS_TICK, TooltipCard, TooltipLine } from './ChartTooltip';
import { compactMoney, SERIES } from './viz';

/** One month on the chart. The numbers are geometry for Recharts; `raw` holds the server's
 *  own strings, which are the only figures ever printed (ADR-0022 §2). */
interface Row {
  label: string;
  in: number;
  committed: number;
  flexible: number;
  invested: number;
  untracked: number;
  left: number;
  raw: ReviewMonth;
}

const n = (m: Money | null | undefined) => (m == null ? 0 : Number(m));
export const INCOME = 'var(--chart-income)';
export const LEFT_OVER = 'var(--viz-4)';
const UNTRACKED = 'var(--chart-neutral)';

function TooltipBody({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const m = (payload[0]!.payload as Row).raw;
  return (
    <TooltipCard
      title={
        <>
          {cycleMonthName(m.endDate)}
          {m.current && <span className="ml-space-1 font-normal text-ink-muted">so far</span>}
        </>
      }
    >
      <TooltipLine label="Income" colour={INCOME} value={m.income} />
      {m.planTracked ? (
        <>
          <TooltipLine label="Committed — bills & EMIs" colour={SERIES.committed} value={m.committed} />
          <TooltipLine label="Day to day" colour={SERIES.flexible} value={m.flexible} />
        </>
      ) : (
        <TooltipLine label="Expenses (plan not running yet)" colour={UNTRACKED} value={m.spend} />
      )}
      <TooltipLine label="Invested" colour={SERIES.invested} value={m.invested} />
      <TooltipLine label="Left after expenses" colour={LEFT_OVER} value={m.leftOver} strong />
    </TooltipCard>
  );
}

/**
 * Per salary month, three bars left to right (user, 2026-11-09): **income**, then
 * **expenses** split into committed / day-to-day / invested, then **what was left after
 * expenses**. Read as an equation - income minus the middle bar is the right bar - which is
 * the month's whole story in one glance. A month that spent more than came in shows its
 * left-over bar below the line, plainly; it is not coloured as a failure (rule 8).
 */
export function InOutChart({ months }: { months: ReviewMonth[] }) {
  const rows: Row[] = months
    .filter((m) => m.recorded)
    .map((m) => ({
      label: `${cycleMonthName(m.endDate)}${m.current ? ' (so far)' : ''}`,
      in: n(m.income),
      committed: m.planTracked ? n(m.committed) : 0,
      flexible: m.planTracked ? n(m.flexible) : 0,
      untracked: m.planTracked ? 0 : n(m.spend),
      invested: n(m.invested),
      left: n(m.leftOver),
      raw: m,
    }));

  if (rows.length === 0) return null;

  return (
    <div className="h-[260px] w-full md:h-[340px]" role="img" aria-label="Per salary month: income, expenses split by kind, and what was left after expenses. Hover a month for its figures.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} barGap={6} barCategoryGap="24%" margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
          <YAxis width={56} tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={(v: number) => compactMoney(String(v))} />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Tooltip content={TooltipBody} cursor={{ fill: 'var(--sunken)' }} />
          <Bar dataKey="in" name="Income" fill={INCOME} maxBarSize={28} radius={[4, 4, 0, 0]} />
          <Bar dataKey="untracked" stackId="out" name="Expenses" fill={UNTRACKED} maxBarSize={28} stroke="var(--surface)" strokeWidth={1.5} />
          <Bar dataKey="committed" stackId="out" name="Committed" fill={SERIES.committed} maxBarSize={28} stroke="var(--surface)" strokeWidth={1.5} />
          <Bar dataKey="flexible" stackId="out" name="Day to day" fill={SERIES.flexible} maxBarSize={28} stroke="var(--surface)" strokeWidth={1.5} />
          <Bar dataKey="invested" stackId="out" name="Invested" fill={SERIES.invested} maxBarSize={28} stroke="var(--surface)" strokeWidth={1.5} radius={[4, 4, 0, 0]} />
          <Bar dataKey="left" name="Left after expenses" fill={LEFT_OVER} maxBarSize={28} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
