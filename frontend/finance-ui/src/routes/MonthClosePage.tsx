import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { useGetCurrentCycleQuery, useGetCycleQuery, useCloseCycleMutation } from '@/services/cycleService';
import { useGetCommitmentInstancesForCycleQuery } from '@/services/commitmentInstanceService';
import { Button } from '@/components/Button';
import { StepProgress } from '@/components/StepProgress';
import { MONTH_CLOSE_ENABLED } from '@/lib/releaseGates';
import { ConfirmBalancesStep } from '@/features/monthClose/components/ConfirmBalancesStep';
import { ResolveStep } from '@/features/monthClose/components/ResolveStep';
import { ReviewStep } from '@/features/monthClose/components/ReviewStep';
import { WhatMovedStep } from '@/features/monthClose/components/WhatMovedStep';
import { CloseStep } from '@/features/monthClose/components/CloseStep';
import { cycleProgress, formatShortDate } from '@/lib/dates';
import type { CycleSnapshotResponse } from '@/types/cycle';
import type { AppError } from '@/types/errors';

// 'review' replaced "What happened" (totals only) and the "still learning your normal"
// filler (2026-09-18): the month against its plan, and what's different next month.
const STEPS = ['confirm', 'resolve', 'review', 'moved', 'close'] as const;
const STEP_NAMES = ['Balances', 'Resolve', 'Review', 'What moved', 'Close'] as const;

export default function MonthClosePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [snapshot, setSnapshot] = useState<CycleSnapshotResponse | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);

  // `?cycle=<id>` closes the month Months was showing. Without it this always closed
  // the current cycle - fine when only the current month could be viewed, wrong once a
  // past month's "Close cycle" can be pressed.
  const [params] = useSearchParams();
  const rawCycle = params.get('cycle');
  const explicitId = rawCycle && /^\d+$/.test(rawCycle) ? Number(rawCycle) : undefined;
  const { data: currentCycle, isLoading: currentLoading } = useGetCurrentCycleQuery();
  const { data: explicitCycle, isLoading: explicitLoading } = useGetCycleQuery(explicitId ?? 0, { skip: explicitId == null });
  const cycle = explicitId != null ? explicitCycle : currentCycle;
  const cycleLoading = explicitId != null ? explicitLoading : currentLoading;
  const { data: instances, isLoading: instancesLoading } = useGetCommitmentInstancesForCycleQuery(cycle?.id ?? 0, {
    skip: !cycle,
  });
  const [closeCycle, { isLoading: isClosing }] = useCloseCycleMutation();

  // The same `cycleProgress().ended` Months uses. This page is reachable by URL, so it is
  // its own gate rather than a formality - but it must reach the same verdict.
  const canClose = cycle ? cycleProgress(cycle.startDate, cycle.endDate).ended : false;

  const handleBack = () => (step === 0 ? navigate('/month') : setStep((s) => s - 1));
  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  const handleClose = async () => {
    if (!cycle) return;
    setCloseError(null);
    try {
      const result = await closeCycle(cycle.id).unwrap();
      setSnapshot(result);
    } catch (err) {
      setCloseError((err as AppError).message ?? "Couldn't close the cycle.");
    }
  };

  if (cycleLoading) return null;

  if (!cycle || (!canClose && !cycle.closed)) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-space-4 py-space-12 text-center">
        <p className="text-body text-ink-muted">This cycle isn't over yet - nothing to close.</p>
        <Button variant="secondary" onClick={() => navigate('/month')}>
          Back to Month
        </Button>
      </div>
    );
  }

  if (cycle.closed && !snapshot) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-space-4 py-space-12 text-center">
        <p className="text-body text-ink-muted">This cycle is already closed.</p>
        {/* Was "See history" → /plan. That screen is Goals only now and shows no cycle
            history, so the button would have landed somewhere that doesn't have it. */}
        <Button variant="secondary" onClick={() => navigate('/month')}>
          Back to Months
        </Button>
      </div>
    );
  }

  return (
    // A focus flow: the navigation is hidden (AppShell), so the way out is explicit, the steps are
    // named, and the actions stay in reach at the foot of the screen (UI_UX_REVAMP_PLAN 4.6).
    <div className="mx-auto flex w-full max-w-xl flex-col gap-space-8">
      {!snapshot && (
        <header className="flex flex-col gap-space-4">
          <div className="flex items-center justify-between gap-space-4">
            <button
              type="button"
              onClick={() => navigate('/month')}
              className="-ml-space-1 flex items-center gap-space-1 rounded-md px-space-1 text-caption text-ink-muted transition-colors hover:text-ink"
            >
              <X size={14} strokeWidth={1.5} aria-hidden />
              Exit
            </button>
            <p className="num text-caption text-ink-muted">
              Closing {formatShortDate(cycle.startDate)} – {formatShortDate(cycle.endDate)}
            </p>
          </div>
          <StepProgress steps={STEP_NAMES} current={step} />
        </header>
      )}

      {STEPS[step] === 'confirm' && <ConfirmBalancesStep />}
      {STEPS[step] === 'resolve' && <ResolveStep instances={instances} isLoading={instancesLoading} />}
      {STEPS[step] === 'review' && <ReviewStep cycle={cycle} />}
      {STEPS[step] === 'moved' && <WhatMovedStep />}
      {STEPS[step] === 'close' && (
        <CloseStep
          onClose={handleClose}
          isClosing={isClosing}
          error={closeError}
          snapshot={snapshot}
          onDone={() => navigate('/month')}
          enabled={MONTH_CLOSE_ENABLED}
        />
      )}

      {!snapshot && (
        <div
          className="sticky bottom-0 -mx-space-4 flex items-center justify-between gap-space-3 border-t border-line bg-ground px-space-4 py-space-3 md:mx-0 md:px-0"
          style={{ paddingBottom: 'max(var(--spacing-space-3), env(safe-area-inset-bottom))' }}
        >
          {step > 0 ? (
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
              Back
            </Button>
          ) : (
            <span />
          )}
          {STEPS[step] !== 'close' && (
            <Button variant="primary" onClick={handleNext}>
              Continue
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
