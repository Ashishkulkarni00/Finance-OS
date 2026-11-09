import { Select } from '@/components/Select';
import { addMonths, dueLabel, monthLabel } from './commitmentForm';

interface PaymentMonthPickerProps {
  /** `YYYY-MM`. */
  value: string;
  onChange: (value: string) => void;
  dueDay: number;
  ariaLabel: string;
}

/**
 * One dropdown for a month: "November 2026 · due 5 Nov".
 *
 * <p>Was a month select, a year select and a date beside them - three things to read to
 * answer "when does it start?" (user, 2026-11-09: "too complicated"). The range is a year
 * back and two ahead of the chosen month, which covers starting a bill late and planning
 * one ahead; anything further is an edit nobody makes.
 */
export function PaymentMonthPicker({ value, onChange, dueDay, ariaLabel }: PaymentMonthPickerProps) {
  const options = Array.from({ length: 37 }, (_, i) => addMonths(value, i - 12)).map((ym) => {
    const due = dueLabel(ym, dueDay);
    return { value: ym, label: due ? `${monthLabel(ym)} · due ${due}` : monthLabel(ym) };
  });
  return (
    <Select
      variant="row"
      className="-ml-space-1 max-w-full"
      ariaLabel={ariaLabel}
      value={value}
      options={options}
      onChange={(v) => v && onChange(v)}
    />
  );
}
