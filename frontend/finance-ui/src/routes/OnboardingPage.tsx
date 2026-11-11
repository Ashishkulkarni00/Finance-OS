import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepProgress } from '@/components/StepProgress';
import { APP_NAME } from '@/lib/brand';
import { PayDayStep } from '@/features/onboarding/components/PayDayStep';
import { AccountsStep } from '@/features/onboarding/components/AccountsStep';
import { IncomeStep } from '@/features/onboarding/components/IncomeStep';
import { CommitmentsStep } from '@/features/onboarding/components/CommitmentsStep';
import { ReservationsStep } from '@/features/onboarding/components/ReservationsStep';
import { OnboardingStrip } from '@/features/onboarding/components/OnboardingStrip';

const STEPS = ['payday', 'accounts', 'income', 'commitments', 'reservations'] as const;
const STEP_NAMES = ['Pay day', 'Accounts', 'Income', 'Commitments', 'Set aside'] as const;

/**
 * First-run setup (UI_UX_REVAMP_PLAN 4.11): a focus layout - no navigation, because there is nowhere
 * else to go yet - with the steps named, and the one number Kosh computes growing along the foot of
 * the screen as each step adds data. It lands on Today with a one-time welcome line.
 *
 * <p>Outside `AppShell` by design (the route is registered beside it), so it carries its own wordmark.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const finish = () => navigate('/today', { state: { welcome: true } });
  // The strip has nothing to say before there are accounts.
  const showStrip = step >= 1;

  return (
    <div className="flex min-h-dvh flex-col bg-ground">
      <header className="mx-auto flex w-full max-w-xl flex-col gap-space-4 px-space-4 pt-space-5 md:pt-space-6">
        <span className="text-[15px] font-semibold leading-5 tracking-[-0.005em] text-ink">{APP_NAME}</span>
        <StepProgress steps={STEP_NAMES} current={step} />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-space-8 px-space-4 py-space-6 pb-40">
        {STEPS[step] === 'payday' && <PayDayStep onContinue={next} />}
        {STEPS[step] === 'accounts' && <AccountsStep onContinue={next} />}
        {STEPS[step] === 'income' && <IncomeStep onContinue={next} />}
        {STEPS[step] === 'commitments' && <CommitmentsStep onContinue={next} />}
        {STEPS[step] === 'reservations' && <ReservationsStep onDone={finish} />}
      </main>

      {showStrip && (
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto w-full max-w-xl px-space-4 py-space-2">
            <OnboardingStrip />
          </div>
        </div>
      )}
    </div>
  );
}
