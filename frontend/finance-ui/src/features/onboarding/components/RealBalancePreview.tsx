import { NumberDisplay } from '@/components/NumberDisplay';
import { UnknownState } from '@/components/UnknownState';
import { useAnimatedMoney } from '@/lib/useAnimatedMoney';
import { useGetPositionQuery } from '@/services/positionService';

/**
 * "SHOW REAL BALANCE HERE, even though it is still wrong" - the governing rule of
 * onboarding is that value arrives before the work does, and every commitment added
 * afterwards visibly sharpens this same number. SCREEN_SPECS S7.
 */
export function RealBalancePreview() {
  const { data: position } = useGetPositionQuery();
  const animated = useAnimatedMoney(position?.state === 'OK' ? position.realBalance : undefined);

  if (!position) return null;

  if (position.state === 'INCOMPLETE') {
    return <UnknownState reason={position.reason} />;
  }

  return <NumberDisplay label="Real balance" value={animated} role="hero" />;
}
