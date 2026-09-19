import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import { useGetPositionQuery } from '@/services/positionService';
import { useGetCommitmentInstancesForCycleQuery, useGetCommitmentPlanProgressQuery } from '@/services/commitmentInstanceService';
import { MonthOverview } from '@/features/month/components/MonthOverview';
import type { CycleMode } from '@/features/month/components/MonthOverview';
import { InsightList } from '@/components/InsightList';
import { formatShortDate } from '@/lib/dates';
import { PlanZone } from '@/features/month/components/PlanZone';
import { FlexibleSpendingSection } from '@/features/month/components/FlexibleSpendingSection';
import { MonthPrimer } from '@/features/month/components/MonthPrimer';
import { MonthGuideSheet } from '@/features/month/components/MonthGuideSheet';
import { CycleSwitcher } from '@/features/month/components/CycleSwitcher';
import { useSelectedCycle } from '@/features/month/useSelectedCycle';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';

/** A full-width hairline above each section after the overview. */
function Divided({ children }: { children: ReactNode }) {
  return <div className="border-t border-line pt-space-8">{children}</div>;
}

/**
 * "The Briefing" - docs/product/MONTH_EXPERIENCE.md, docs/design/MONTH_TAB_UX_SPEC.md -
 * now for any month, not only the current one.
 *
 * <p>The switcher in the header moves between cycles; `?cycle=<id>` holds the choice. What
 * the page shows depends on which kind of month it is:
 * <ul>
 *   <li><strong>This month</strong>: unchanged - overview, Needs you, the plan, day-to-day spending.</li>
 *   <li><strong>Upcoming</strong>: what's planned, and the plan itself. Needs you and
 *       day-to-day spending are hidden - nothing needs acting on today in a month that
 *       hasn't started, and nothing has been spent in it.</li>
 *   <li><strong>Past</strong>: how the plan went, the plan (with what was left unpaid), and
 *       what was spent. Needs you is hidden - it's a list of things to do today.</li>
 * </ul>
 */
export default function MonthPage() {
  const navigate = useNavigate();
  const [guideOpen, setGuideOpen] = useState(false);
  const selected = useSelectedCycle();
  const { cycle, isCurrent, isFuture } = selected;

  const { data: position, isLoading: positionLoading } = useGetPositionQuery();
  const {
    data: instances,
    isLoading: instancesLoading,
    isFetching: instancesFetching,
    isError: instancesError,
  } = useGetCommitmentInstancesForCycleQuery(cycle?.id ?? 0, { skip: !cycle });
  const { data: planProgress } = useGetCommitmentPlanProgressQuery(cycle?.id ?? 0, { skip: !cycle });

  const mode: CycleMode = isCurrent ? 'current' : isFuture ? 'future' : 'past';
  const canClose = cycle ? new Date(cycle.endDate).getTime() < Date.now() : false;
  // Bills only: expected income is shown in the plan's "Coming in" block, not as a payment.
  const bills = (instances ?? []).filter((i) => i.settleAs !== 'INCOME');
  // A late salary is flagged too (only once late) - it needs recording like any planned item.
  const nextUp = bills
    .filter((i) => i.attentionTier === 'WORTH_KNOWING')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  // "No cycle yet", and a switch to a different month still loading, both read as loading
  // so no zone shows the previous month's plan under the new month's name.
  const instancesPending = instancesLoading || !cycle || (instancesFetching && !instances);

  return (
    <div className="flex flex-col gap-space-8">
      <div className="flex flex-col gap-space-6">
        <div className="flex items-start justify-between gap-space-4">
          <div className="flex flex-col gap-space-2">
            <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Months · salary to salary</span>
            <CycleSwitcher
              cycle={cycle}
              currentCycle={selected.currentCycle}
              isCurrent={isCurrent}
              isFuture={isFuture}
              moving={selected.moving}
              onPrevious={selected.goPrevious}
              onNext={selected.goNext}
              onCurrent={selected.goCurrent}
            />
          </div>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="flex shrink-0 items-center gap-space-1 rounded-md px-space-1 text-caption text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <CircleHelp size={14} strokeWidth={1.5} aria-hidden />
            How Months works
          </button>
        </div>

        <MonthPrimer onOpenGuide={() => setGuideOpen(true)} />
      </div>

      {selected.isError ? (
        <ErrorState message="We couldn't load this month. Check your connection and try again." onRetry={selected.refetch} />
      ) : (
        <>
          <MonthOverview
            mode={mode}
            cycle={cycle}
            cycleLoading={selected.isLoading}
            position={position}
            positionLoading={positionLoading}
            progress={planProgress}
            instances={instances}
          />

          {mode === 'current' && (
            <Divided>
              <InsightList
                surface="MONTH"
                calmNote={nextUp ? `Next: ${nextUp.commitmentName}, ${formatShortDate(nextUp.dueDate)}.` : undefined}
              />
            </Divided>
          )}

          <Divided>
            <PlanZone
              cycle={cycle}
              instances={instances}
              progress={planProgress}
              isLoading={instancesPending}
              isError={instancesError}
            />
          </Divided>

          {mode !== 'future' && (
            <Divided>
              <FlexibleSpendingSection cycle={cycle} />
            </Divided>
          )}

          {canClose && cycle && !cycle.closed && (
            <Card className="flex items-center justify-between">
              <div>
                <p className="text-body text-ink">This cycle has ended.</p>
                <p className="text-caption text-ink-muted">Close it with understanding, not just a tap.</p>
              </div>
              {/* Carries the cycle being viewed - the close flow used to always act on the
                  current cycle, which is the wrong one once you can view a past month. */}
              <Button variant="primary" onClick={() => navigate(`/month/close?cycle=${cycle.id}`)}>
                Close cycle
              </Button>
            </Card>
          )}
        </>
      )}

      <MonthGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
