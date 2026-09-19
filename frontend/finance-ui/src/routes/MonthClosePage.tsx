import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGetCurrentCycleQuery, useGetCycleQuery, useCloseCycleMutation } from '@/services/cycleService';
import { useGetCommitmentInstancesForCycleQuery } from '@/services/commitmentInstanceService';
import { Button } from '@/components/Button';
import { StepDots } from '@/features/monthClose/components/StepDots';
import { ConfirmBalancesStep } from '@/features/monthClose/components/ConfirmBalancesStep';
import { ResolveStep } from '@/features/monthClose/components/ResolveStep';
import { ReviewStep } from '@/features/monthClose/components/ReviewStep';
import { WhatMovedStep } from '@/features/monthClose/components/WhatMovedStep';
import { CloseStep } from '@/features/monthClose/components/CloseStep';
import type { CycleSnapshotResponse } from '@/types/cycle';
import type { AppError } from '@/types/errors';

// 'review' replaced "What happened" (totals only) and the "still learning your normal"
// filler (2026-09-18): the month against its plan, and what's different next month.
const STEPS = ['confirm', 'resolve', 'review', 'moved', 'close'] as const;

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

  const canClose = cycle ? new Date(cycle.endDate).getTime() < Date.now() : false;

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
    <div className="mx-auto flex max-w-2xl flex-col gap-space-8 py-space-6">
      {!snapshot && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-space-2 text-caption text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            Back
          </button>
          <StepDots count={STEPS.length} current={step} />
        </div>
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
        />
      )}

      {STEPS[step] !== 'close' && (
        <div>
          <Button variant="primary" onClick={handleNext}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
