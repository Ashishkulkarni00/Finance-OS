import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useGetMeQuery, useUpdateMeMutation } from '@/services/userService';

interface PayDayStepProps {
  onContinue: () => void;
}

/** Step 1 - "one question, defines everything." SCREEN_SPECS S7. */
export function PayDayStep({ onContinue }: PayDayStepProps) {
  const { data: me } = useGetMeQuery();
  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const [selected, setSelected] = useState<number | null>(null);

  const day = selected ?? me?.cycleStartDay ?? null;

  const handleContinue = async () => {
    if (day && day !== me?.cycleStartDay) {
      await updateMe({ cycleStartDay: day }).unwrap();
    }
    onContinue();
  };

  return (
    <div className="flex flex-col gap-space-6">
      <div>
        <h1 className="text-editorial font-serif text-ink">When are you paid?</h1>
        <p className="mt-space-2 text-body text-ink-muted">
          The day your salary lands. Your financial month runs from that day to the day before it comes again - not
          the calendar month.
        </p>
      </div>

      <div className="grid grid-cols-7 gap-space-2">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelected(d)}
            className={cn(
              'num flex h-11 items-center justify-center rounded-lg border text-label transition-colors duration-150',
              day === d ? 'border-accent bg-accent-wash text-accent' : 'border-border text-ink-soft hover:bg-sunken',
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!day || isLoading}
          className="h-11 rounded-lg bg-accent px-space-5 text-label font-medium text-white transition-colors duration-150 hover:bg-accent-hover disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
