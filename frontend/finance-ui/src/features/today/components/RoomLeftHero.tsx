import { Amount } from '@/components/Amount';
import { Statement, StatementRow } from '@/components/Statement';
import { useAnimatedMoney } from '@/lib/useAnimatedMoney';
import { UnknownState } from '@/components/UnknownState';
import { Skeleton } from '@/components/Skeleton';
import { PositionBlockers } from '@/features/commitments/components/PositionBlockers';
import type { PositionResponse } from '@/types/position';
import type { CycleResponse } from '@/types/cycle';
import { formatSalaryDate } from '@/lib/dates';

interface RoomLeftHeroProps {
  position: PositionResponse | undefined;
  cycle: CycleResponse | undefined;
  isLoading: boolean;
}

/**
 * Room Left - the hero, and the only figure on the screen at this size.
 * SCREEN_SPECS S1 hierarchy #1.
 *
 * <p>Now says where it comes from, in one sentence under the figure. The bare number was
 * the product's whole claim with no visible working: "₹522" on its own reads as a
 * balance, and it isn't one - it's a *share*, and the thing it's a share of (Real
 * balance, spread to salary) was two sections further down. The sentence names both
 * figures the server already returned; nothing is divided here.
 */
export function RoomLeftHero({ position, cycle, isLoading }: RoomLeftHeroProps) {
  const animatedRoomLeft = useAnimatedMoney(position?.state === 'OK' ? position.roomLeft : null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!position || position.state === 'INCOMPLETE') {
    return (
      <div className="flex flex-col gap-space-3">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Room left today</span>
        <UnknownState reason={position?.reason ?? "We couldn't reach the server."} />
        {position?.state === 'INCOMPLETE' && <PositionBlockers blockers={position.blockers} />}
      </div>
    );
  }

  // A comparison for colour, not arithmetic on money.
  const negative = Number(position.roomLeft) < 0;

  return (
    <div className="flex flex-col gap-space-4">
      <div className="flex flex-col gap-space-2">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Room left today</span>
        <Amount value={animatedRoomLeft} role="hero" className={negative ? undefined : 'text-accent'} emphasiseNegative />
        <p className="max-w-[34rem] text-body text-ink-soft">
          Your real balance of <Amount value={position.realBalance} role="body" className="text-ink" />, spread
          evenly across the days until salary
          {cycle ? <> on {formatSalaryDate(cycle.endDate)}</> : null}.
          {negative && ' You’ve spent past today’s share - tomorrow’s will be smaller.'}
        </p>
      </div>

      <Statement>
        <StatementRow label="Your share for today" value={position.roomToday} />
        <StatementRow label="Spent today" value={position.spentToday} deduct />
        <StatementRow variant="subtotal" label="Room left" value={position.roomLeft} emphasiseNegative />
      </Statement>
    </div>
  );
}
