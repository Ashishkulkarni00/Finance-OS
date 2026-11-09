import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { ReviewCategory } from '@/types/review';
import { AXIS_TICK, TooltipCard, TooltipLine } from './ChartTooltip';
import { compactMoney, SERIES } from './viz';

interface Row {
  name: string;
  committed: number;
  flexible: number;
  raw: ReviewCategory;
}

function TooltipBody({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const c = (payload[0]!.payload as Row).raw;
  return (
    <TooltipCard title={c.name}>
      <TooltipLine label="Paid a planned bill" colour={SERIES.committed} value={c.committed} />
      <TooltipLine label="Day to day" colour={SERIES.flexible} value={c.flexible} />
      <TooltipLine label="Total" value={c.total} strong />
    </TooltipCard>
  );
}

/**
 * Categories, largest first, each split into the part that paid a planned bill and the part
 * that was day-to-day (ADR-0022). Horizontal, because category names are long and bars on
 * one baseline compare exactly - the job a pie is often asked to do and can't.
 */
export function CategoryBars({ categories }: { categories: ReviewCategory[] }) {
  const rows: Row[] = categories.map((c) => ({ name: c.name, committed: Number(c.committed), flexible: Number(c.flexible), raw: c }));
  const height = Math.max(120, rows.length * 34 + 24);

  return (
    <div className="w-full" style={{ height }} role="img" aria-label="Spending by category, largest first, split into planned bills and day-to-day. Hover a category for its figures.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" barCategoryGap={8} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--line)" />
          <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={(v: number) => compactMoney(String(v))} />
          <YAxis type="category" dataKey="name" width={140} tickLine={false} axisLine={false} tick={{ ...AXIS_TICK, fill: 'var(--ink)' }} />
          <Tooltip content={TooltipBody} cursor={{ fill: 'var(--sunken)' }} />
          <Bar dataKey="committed" stackId="c" fill={SERIES.committed} maxBarSize={18} stroke="var(--surface)" strokeWidth={2} />
          <Bar dataKey="flexible" stackId="c" fill={SERIES.flexible} maxBarSize={18} stroke="var(--surface)" strokeWidth={2} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
