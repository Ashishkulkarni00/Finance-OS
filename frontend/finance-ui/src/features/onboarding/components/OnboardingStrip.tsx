import { Amount } from '@/components/Amount';
import { FactStrip, type Fact } from '@/components/FactStrip';
import { formatMoney } from '@/lib/money';
import { useGetPositionQuery } from '@/services/positionService';

/**
 * The one number Kosh exists to compute, growing as the user answers (UI_UX_REVAMP_PLAN 4.11): held,
 * less what is set aside, less what is already promised, is what is free. It sits at the foot of every
 * step that adds data, so each answer visibly moves it - the moment the product makes sense.
 *
 * <p>Every figure is the server's `/position`. Nothing is added up from the forms. While a commitment
 * has no amount the server withholds the figure, and the strip says so in the server's own words
 * instead of showing a number that would be a guess.
 */
export function OnboardingStrip() {
  const { data: position } = useGetPositionQuery();
  if (!position) return null;

  if (position.state === 'INCOMPLETE') {
    return (
      <div className="text-caption text-ink-muted">
        <span className="font-medium text-ink">Free until salary</span> appears once every commitment has an amount. {position.reason}
      </div>
    );
  }

  const { held, reserved, committed, cardDues } = position.breakdown;
  const facts: Fact[] = [
    { label: 'Held', value: <Amount value={held} role="row" /> },
    { label: '− Set aside', value: <Amount value={reserved} role="row" /> },
    { label: '− Promised', value: <Amount value={committed} role="row" /> },
    ...(Number(cardDues) > 0 ? [{ label: '− Owed on cards', value: <Amount value={cardDues} role="row" /> }] : []),
    { label: '= Free until salary', value: <Amount value={position.realBalance} role="row" emphasiseNegative className="text-accent" /> },
  ];

  return (
    <div aria-live="polite" aria-label={`So far: ${formatMoney(position.realBalance)} free until salary`}>
      <FactStrip facts={facts} />
    </div>
  );
}
