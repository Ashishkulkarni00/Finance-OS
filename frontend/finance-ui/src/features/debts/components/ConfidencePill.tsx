import { cn } from '@/lib/cn';
import type { LoanConfidence, LoanStatus } from '@/types/loan';

const CONFIDENCE_COPY: Record<LoanConfidence, { label: string; tone: string; title: string }> = {
  CONFIRMED: {
    label: 'Confirmed',
    tone: 'border-positive/40 text-positive',
    title: 'Terms taken from the sanction letter or statement.',
  },
  ESTIMATED: {
    label: 'Estimated',
    tone: 'border-border text-ink-muted',
    title: 'Worked out from what you told us, not from paperwork. Close, not exact.',
  },
  TBD: {
    label: 'Terms not supplied',
    tone: 'border-attention/50 text-attention',
    title: "The real terms have never been supplied, so nothing is derived from them.",
  },
};

const STATUS_COPY: Partial<Record<LoanStatus, { label: string; tone: string; title: string }>> = {
  UNCONFIRMED: {
    label: 'Payment unverified',
    tone: 'border-attention/50 text-attention',
    title: "A payment we couldn't verify. Treated as still owed until you confirm it.",
  },
  SCHEDULED: {
    label: 'Not started',
    tone: 'border-border text-ink-muted',
    title: 'Agreed, but the first EMI hasn\'t fallen yet.',
  },
  CLOSED: {
    label: 'Closed',
    tone: 'border-border text-ink-muted',
    title: 'Fully repaid.',
  },
};

/**
 * The workbook's Confidence column, which is the whole sheet's thesis: <em>"Nothing here
 * is invented. Where a real figure has not been supplied the cell says TBD and the
 * Confidence column says so."</em>
 *
 * <p>Deliberately quiet. This is a statement about our records, not a warning about the
 * user's finances - an Estimated loan is not a problem, it's just not paperwork. Only
 * TBD and an unverified payment get the attention hue, because only those change what
 * you should believe about the numbers next to them.
 */
export function ConfidencePill({ confidence, status }: { confidence: LoanConfidence; status?: LoanStatus }) {
  // A status worth flagging outranks the confidence label - both at once is noise.
  const copy = (status && STATUS_COPY[status]) ?? CONFIDENCE_COPY[confidence];
  if (!copy) return null;

  return (
    <span
      title={copy.title}
      // cursor-pointer, not the semantically "correct" cursor-help: role="button" rows
      // elsewhere already use pointer as the app's one hover-affordance cursor, and a
      // second cursor style here would just reopen the exact inconsistency this fixes -
      // some things showing pointer, others the plain arrow, on the same kind of hint.
      className={cn(
        'inline-flex shrink-0 cursor-pointer rounded-full border px-space-2 py-[2px] text-micro whitespace-nowrap',
        copy.tone,
      )}
    >
      {copy.label}
    </span>
  );
}
