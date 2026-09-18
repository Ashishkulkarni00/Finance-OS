import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepDots } from '@/features/monthClose/components/StepDots';
import { PayDayStep } from '@/features/onboarding/components/PayDayStep';
import { AccountsStep } from '@/features/onboarding/components/AccountsStep';
import { IncomeStep } from '@/features/onboarding/components/IncomeStep';
import { CommitmentsStep } from '@/features/onboarding/components/CommitmentsStep';
import { ReservationsStep } from '@/features/onboarding/components/ReservationsStep';

const STEPS = ['payday', 'accounts', 'income', 'commitments', 'reservations'] as const;

/** Once, ~15 minutes, the riskiest screen in the product - built last, deliberately,
 *  per SCREEN_SPECS S7's own reasoning. Value arrives before the work does: Real
 *  Balance appears the moment accounts exist and sharpens with every commitment
 *  added afterwards (RealBalancePreview, shared across the last three steps). */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const finish = () => navigate('/today');

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-space-8 py-space-6">
      <StepDots count={STEPS.length} current={step} />

      {STEPS[step] === 'payday' && <PayDayStep onContinue={next} />}
      {STEPS[step] === 'accounts' && <AccountsStep onContinue={next} />}
      {STEPS[step] === 'income' && <IncomeStep onContinue={next} />}
      {STEPS[step] === 'commitments' && <CommitmentsStep onContinue={next} />}
      {STEPS[step] === 'reservations' && <ReservationsStep onDone={finish} />}
    </div>
  );
}
