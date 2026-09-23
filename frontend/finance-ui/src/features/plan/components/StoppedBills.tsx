import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Row } from '@/components/Row';
import { SectionHeader } from '@/components/SectionHeader';
import { formatMoney } from '@/lib/money';
import { ordinalDay } from '@/lib/dates';
import {
  useGetCommitmentRulesQuery,
  useUnarchiveCommitmentRuleMutation,
} from '@/services/commitmentRuleService';
import type { CommitmentResponse } from '@/types/commitmentRule';

/** The bills that have been stopped - archived rules, which generate no occurrences. */
export function useStoppedBills(): CommitmentResponse[] {
  const { data } = useGetCommitmentRulesQuery({ includeArchived: true });
  return (data?.content ?? []).filter((r) => r.archived);
}

/**
 * Stopped bills, and the one click that starts them again.
 *
 * <p>Exists because stopping a bill used to make it <strong>unreachable</strong>. The plan
 * lists this cycle's occurrences, and a stopped rule generates none - so it had no row to
 * click, appeared in no list, and could only be found by typing its id into the URL, which
 * nothing told you. Tapping "Stop" by accident was therefore unrecoverable through the UI.
 *
 * <p>Deliberately folded away rather than shown outright: these are not part of this
 * month's plan, and a permanent list of things you decided not to pay would be noise on
 * the screen you use to pay things.
 */
export function StoppedBills({ bills, onClose }: { bills: CommitmentResponse[]; onClose: () => void }) {
  const navigate = useNavigate();
  const [unarchive, { isLoading }] = useUnarchiveCommitmentRuleMutation();
  const [error, setError] = useState<string | null>(null);

  if (bills.length === 0) return null;

  const start = async (id: number) => {
    setError(null);
    try {
      await unarchive(id).unwrap();
      // Nothing stopped is left, so the panel has nothing to show - close it rather than
      // leave an empty box behind.
      if (bills.length === 1) onClose();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't start it again.");
    }
  };

  return (
    <section className="mb-space-6">
      <SectionHeader
        trailing={
          <button type="button" onClick={onClose} className="text-caption text-ink-muted underline-offset-4 hover:text-ink hover:underline">
            Hide
          </button>
        }
      >
        Stopped
      </SectionHeader>

      <p className="mb-space-3 text-caption text-ink-muted">
        Not in any month while they’re stopped. Their history is kept — starting one again picks it up from this month.
      </p>

      <div className="flex flex-col">
        {bills.map((bill) => (
          <Row
            key={bill.id}
            domainRule="commit"
            primary={bill.name}
            secondary={
              bill.amountType === 'FIXED'
                ? `${formatMoney(bill.fixedAmount)} · ${bill.frequency.toLowerCase()} on the ${ordinalDay(bill.dueDay)}`
                : `Amount varies · ${bill.frequency.toLowerCase()} on the ${ordinalDay(bill.dueDay)}`
            }
            trailing={
              <span className="flex items-center gap-space-2">
                <Button size="sm" variant="ghost" onClick={() => navigate(`/commitment-rules/${bill.id}`)}>
                  Open
                </Button>
                <Button size="sm" variant="secondary" disabled={isLoading} onClick={() => start(bill.id)}>
                  Start it again
                </Button>
              </span>
            }
          />
        ))}
      </div>

      {error && <p className="mt-space-2 text-caption text-critical">{error}</p>}
    </section>
  );
}
