import type { ReactNode } from 'react';
import { InfoTip } from './InfoTip';

/** Borderless controls - the row's own hairline is the only rule on screen. A box
 *  around every field turns a form into a stack of competing rectangles. */
export const FORM_ROW_CONTROL = 'w-full min-w-0 bg-transparent text-label text-ink outline-none placeholder:text-ink-muted';

/**
 * One attribute of a record: label left in a fixed column, value right, a hairline
 * between rows. This is `Statement`'s layout, which is how every other figure in the
 * product is presented - reading a form as a document you're filling in, rather than a
 * generic web form, is most of the difference between "basic" and "considered".
 *
 * <p>Shared by the transaction form, the settle sheet and every add-a-thing form that
 * followed it - built once for the transaction modal, then re-typed inline the first
 * time a second form needed it. Extracted here before a third copy could happen.
 *
 * <p>`hint` puts an ⓘ beside the label that explains the field on hover (or tap) - for
 * fields whose meaning isn't obvious from a one-word label.
 */
export function FormRow({ label, error, hint, children }: { label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="border-b border-line last:border-b-0">
      <div className="flex items-center gap-space-4 px-space-4 py-space-3 transition-colors duration-150 focus-within:bg-sunken">
        <span className="flex w-24 shrink-0 items-center gap-space-1 text-label text-ink-soft">
          {label}
          {hint && <InfoTip label={label}>{hint}</InfoTip>}
        </span>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {error && <p className="px-space-4 pb-space-2 text-caption text-critical">{error}</p>}
    </div>
  );
}
