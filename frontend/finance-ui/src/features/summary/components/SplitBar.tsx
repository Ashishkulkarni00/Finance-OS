import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { Money } from '@/lib/money';
import { TooltipCard, TooltipLine } from './ChartTooltip';

export interface SplitPart {
  key: string;
  label: string;
  value: Money;
  colour: string;
  /** Ink for the share printed inside the part - white or near-black by the fill's luminance. */
  ink: string;
}

/**
 * One whole, split into its parts, as a single tall bar (ADR-0022) - the "whole at a glance"
 * job a pie is usually asked for, on a bar whose parts compare by length. Each part prints its
 * share inside when it fits; hovering gives every part's figure.
 */
export function SplitBar({ parts, title }: { parts: SplitPart[]; title: string }) {
  const whole = parts.reduce((s, p) => s + Number(p.value), 0); // proportions for drawing only
  const row: Record<string, number | string> = { name: title };
  for (const p of parts) row[p.key] = Number(p.value);

  const TooltipBody = ({ active }: TooltipContentProps<ValueType, NameType>) =>
    active ? (
      <TooltipCard title={title}>
        {parts.map((p) => (
          <TooltipLine key={p.key} label={p.label} colour={p.colour} value={p.value} />
        ))}
      </TooltipCard>
    ) : null;

  return (
    <div className="h-[36px] w-full" role="img" aria-label={`${title}: ${parts.map((p) => p.label).join(', ')}. Hover for figures.`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[row]} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis type="number" hide domain={[0, whole || 1]} />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip content={TooltipBody} cursor={false} />
          {parts.map((p, i) => (
            <Bar
              key={p.key}
              dataKey={p.key}
              stackId="w"
              fill={p.colour}
              stroke="var(--surface)"
              strokeWidth={2}
              barSize={28}
              radius={i === 0 && parts.length === 1 ? 4 : i === 0 ? [4, 0, 0, 4] : i === parts.length - 1 ? [0, 4, 4, 0] : 0}
            >
              <LabelList
                dataKey={p.key}
                position="insideLeft"
                formatter={(v: unknown) => {
                  const frac = whole > 0 ? Number(v) / whole : 0;
                  return frac >= 0.12 ? `${Math.round(frac * 100)}%` : '';
                }}
                style={{ fill: p.ink, fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
