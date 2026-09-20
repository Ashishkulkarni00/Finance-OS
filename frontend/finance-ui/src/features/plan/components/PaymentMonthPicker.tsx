import { Select } from '@/components/Select';
import { formatDayMonthYear } from '@/lib/dates';
import { MONTH_NAMES } from './commitmentForm';

interface PaymentMonthPickerProps {
  /** The calendar month picked, `YYYY-MM`. */
  value: string;
  onChange: (month: string) => void;
  /** The due day as entered - the date shown beside the pickers is this day of that month. */
  dueDay: number;
  ariaLabel: string;
}

/**
 * Month + year of a payment, with the real date it gives beside it ("5 Oct 2026").
 *
 * <p>Calendar months, not salary months: "October" here means the payment dated in October.
 * The salary month it lands in is worked out from that date, never asked for - a picker that
 * showed "28 Sep – 27 Oct" for October left people unsure what they were choosing.
 */
export function PaymentMonthPicker({ value, onChange, dueDay, ariaLabel }: PaymentMonthPickerProps) {
  const year = Number(value.slice(0, 4));
  const month = value.slice(5, 7);
  const thisYear = new Date().getFullYear();
  const from = Math.min(thisYear - 10, year);
  const to = Math.max(thisYear + 10, year);
  const years = Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
  const validDay = Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= 28;

  return (
    <span className="flex flex-wrap items-center gap-space-2">
      <Select
        variant="row"
        className="-ml-space-1"
        ariaLabel={`${ariaLabel} - month`}
        value={month}
        options={MONTH_NAMES.map((name, i) => ({ value: String(i + 1).padStart(2, '0'), label: name }))}
        onChange={(v) => v && onChange(`${year}-${v}`)}
      />
      <Select
        variant="row"
        ariaLabel={`${ariaLabel} - year`}
        value={String(year)}
        options={years.map((y) => ({ value: y, label: y }))}
        onChange={(v) => v && onChange(`${v}-${month}`)}
      />
      <span className="num text-caption text-ink-muted">
        {validDay ? `on ${formatDayMonthYear(`${value}-${String(dueDay).padStart(2, '0')}`)}` : 'enter the day above'}
      </span>
    </span>
  );
}
