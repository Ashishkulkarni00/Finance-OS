import { Select } from '@/components/Select';
import { formatShortDate, salaryMonth, salaryMonthOf } from '@/lib/dates';
import { MONTH_NAMES } from './commitmentForm';

interface SalaryMonthPickerProps {
  /** The chosen salary month's start date. */
  value: string;
  /** Any known cycle start (the current one) - months are stepped from it. */
  knownStart: string;
  onChange: (start: string) => void;
  ariaLabel: string;
  /** Years offered: this many back and ahead of today. */
  yearsBack?: number;
  yearsAhead?: number;
}

/**
 * Month + year for a salary month - the same two pickers "Last payment" uses, so a bill can
 * start (or a one-off sit) in any month, not only within a fixed window. The cycle's real
 * dates are shown beside it, since "October" means 28 Sep – 27 Oct.
 */
export function SalaryMonthPicker({ value, knownStart, onChange, ariaLabel, yearsBack = 10, yearsAhead = 10 }: SalaryMonthPickerProps) {
  const { year, month } = salaryMonthOf(value);
  const thisYear = new Date().getFullYear();
  const from = Math.min(thisYear - yearsBack, year);
  const to = Math.max(thisYear + yearsAhead, year);
  const years = Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
  const { start, end } = salaryMonth(knownStart, year, month);
  const pick = (y: number, m: number) => onChange(salaryMonth(knownStart, y, m).start);

  return (
    <span className="flex flex-wrap items-center gap-space-2">
      <Select
        variant="row"
        className="-ml-space-1"
        ariaLabel={`${ariaLabel} - month`}
        value={String(month).padStart(2, '0')}
        options={MONTH_NAMES.map((name, i) => ({ value: String(i + 1).padStart(2, '0'), label: name }))}
        onChange={(v) => v && pick(year, Number(v))}
      />
      <Select
        variant="row"
        ariaLabel={`${ariaLabel} - year`}
        value={String(year)}
        options={years.map((y) => ({ value: y, label: y }))}
        onChange={(v) => v && pick(Number(v), month)}
      />
      <span className="num text-caption text-ink-muted">
        {formatShortDate(start)} – {formatShortDate(end)}
      </span>
    </span>
  );
}
