import { useNavigate } from 'react-router-dom';
import { useGetPositionQuery } from '@/services/positionService';
import { useGetCommitmentInstancesForCycleQuery, useGetCommitmentPlanProgressQuery } from '@/services/commitmentInstanceService';
import { MonthAnswer } from '@/features/month/components/MonthAnswer';
import type { CycleMode } from '@/features/month/components/MonthAnswer';
import { InsightList } from '@/components/InsightList';
import { formatShortDate, cycleProgress, cycleProgressLabel } from '@/lib/dates';
import { PlanZone } from '@/features/month/components/PlanZone';
import { MonthBriefing } from '@/features/month/components/MonthBriefing';
import { MonthHero } from '@/features/month/components/MonthHero';
import { FlexibleSpendingSection } from '@/features/month/components/FlexibleSpendingSection';
import { MoneyInOutSection } from '@/features/month/components/MoneyInOutSection';
import { CycleSwitcher } from '@/features/month/components/CycleSwitcher';
import { useSelectedCycle } from '@/features/month/useSelectedCycle';
import { PageHelpButton, PageSubtitle } from '@/features/help/PageHelp';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Disclosure } from '@/components/Disclosure';
import { ErrorState } from '@/components/ErrorState';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import { MONTH_CLOSE_ENABLED } from '@/lib/releaseGates';

/**
 * Month - "what still has to be paid before my next salary, and how did this month go?"
 *
 * <p>Revamped 2026-11-09 (UI_UX_REVAMP_PLAN 4.5): **the answer, then the worklist, then the
 * working.** A full-width, left-aligned page in reading order:
 *
 * <ol>
 *   <li>The month switcher (real dates) and, for the month in progress, what is still to pay.</li>
 *   <li>What needs the user (at most three; the rest are in the Needs-you panel).</li>
 *   <li>The worklist by date, with what is done folded away.</li>
 *   <li>How the month adds up, open, directly under the answer (moved back up 2026-11-10).</li>
 *   <li>Closed sections for the rest of the working: where day-to-day money went, and what is
 *       different about this month.</li>
 * </ol>
 *
 * <p>The switcher in the header moves between cycles; `?cycle=<id>` holds the choice. What the page
 * shows depends on which kind of month it is: the month in progress, an upcoming month (nothing
 * to act on yet, nothing spent), or a past one (how the plan went, and what was left unpaid).
 *
 * <p><strong>No "Close this month" until release gate G1 passes</strong> (`MONTH_CLOSE_ENABLED`,
 * Part 11 of the plan). The close writes an immutable snapshot, and that must not be offered while
 * the figures it records are unverified.
 */
export default function MonthPage() {
  const navigate = useNavigate();
  const selected = useSelectedCycle();
  const { cycle, isCurrent, isFuture } = selected;
  const closeDoc = useDocAnchor('month.close');

  const { data: position, isLoading: positionLoading } = useGetPositionQuery();
  // `currentData` throughout Month: `data` would show the last month's plan under the new
  // month's name while the switch loads. See useSelectedCycle.
  const {
    currentData: instances,
    isLoading: instancesLoading,
    isFetching: instancesFetching,
    isError: instancesError,
  } = useGetCommitmentInstancesForCycleQuery(cycle?.id ?? 0, { skip: !cycle });
  const { currentData: planProgress } = useGetCommitmentPlanProgressQuery(cycle?.id ?? 0, { skip: !cycle });

  const mode: CycleMode = isCurrent ? 'current' : isFuture ? 'future' : 'past';
  // One definition of "ended" for the whole frontend (`cycleProgress`), so this can never
  // disagree with the server or the other pages.
  const canClose = cycle ? cycleProgress(cycle.startDate, cycle.endDate).ended : false;
  // Commitments only: expected income is shown in the plan's "Coming in" block, not as a payment.
  const bills = (instances ?? []).filter((i) => i.settleAs !== 'INCOME');
  // A late salary is flagged too (only once late) - it needs recording like any planned item.
  const nextUp = bills
    .filter((i) => i.attentionTier === 'WORTH_KNOWING')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  // "No cycle yet", and a switch to a different month still loading, both read as loading
  // so no zone shows the previous month's plan under the new month's name.
  const instancesPending = instancesLoading || !cycle || (instancesFetching && !instances);

  // The switcher prints the dates and the kind of month; only the day count is new on the current one.
  const dayCount = cycle && mode === 'current' ? cycleProgressLabel(cycle.startDate, cycle.endDate).split(' · ').pop() : undefined;

  return (
    <div className="reveal-shell flex w-full flex-col gap-space-6 md:gap-10">
      {/* The switcher is the header: the month's name is the page title. */}
      <div className="flex flex-col gap-space-3">
        <CycleSwitcher
          cycle={cycle}
          currentCycle={selected.currentCycle}
          isCurrent={isCurrent}
          isFuture={isFuture}
          moving={selected.moving}
          onPrevious={selected.goPrevious}
          onNext={selected.goNext}
          onCurrent={selected.goCurrent}
          note={dayCount}
          trailing={<PageHelpButton topic="months.how-months-works" />}
        />
        <PageSubtitle>
          One month, salary to salary: what still has to be paid before your next salary, and what’s free after it.
        </PageSubtitle>
      </div>

      {selected.isError ? (
        <ErrorState message="We couldn't load this month. Check your connection and try again." onRetry={selected.refetch} />
      ) : (
        <>
          <MonthAnswer
            mode={mode}
            cycle={cycle}
            cycleLoading={selected.isLoading}
            position={position}
            positionLoading={positionLoading}
            progress={planProgress}
            instances={instances}
          />

          {/* How the month adds up sits straight under the answer, always open (2026-11-10: the
              closed section buried the working the figure above depends on). One component at
              every width: the figure, its pace, and the working as a ruled statement. */}
          <MonthHero cycle={cycle} mode={mode} />

          {mode === 'current' && (
            <div className="w-full">
              <InsightList
                surface="MONTH"
                limit={2}
                calmNote={nextUp ? `Next: ${nextUp.commitmentName}, ${formatShortDate(nextUp.dueDate)}.` : undefined}
              />
            </div>
          )}

          <PlanZone
            cycle={cycle}
            instances={instances}
            progress={planProgress}
            isLoading={instancesPending}
            isError={instancesError}
            title={mode === 'current' ? 'Coming up' : 'The plan'}
          />

          {/* The working, closed until asked for. Each says what is inside, so none is a mystery. */}
          <div className="flex flex-col">
            <MoneyInOutSection cycle={cycle} mode={mode} />
            {mode !== 'future' && <FlexibleSpendingSection cycle={cycle} />}

            <Disclosure
              storageKey="kosh.month.about"
              label="About this month"
              summary="what’s different, what you changed, commitments kept"
            >
              <MonthBriefing cycle={cycle} mode={mode} progress={planProgress} />
            </Disclosure>
          </div>

          {MONTH_CLOSE_ENABLED && canClose && cycle && !cycle.closed && (
            <Card className="flex items-center justify-between" {...closeDoc}>
              <div>
                <p className="text-body text-ink">This month has ended.</p>
                <p className="text-caption text-ink-muted">Close it with understanding, not just a tap.</p>
              </div>
              {/* Carries the cycle being viewed - the close flow used to always act on the
                  current cycle, which is the wrong one once you can view a past month. */}
              <Button variant="primary" onClick={() => navigate(`/month/close?cycle=${cycle.id}`)}>
                Close this month
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
