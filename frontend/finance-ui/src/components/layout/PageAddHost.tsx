import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closePageAdd } from '@/store/slices/uiSlice';
import { useGetCycleQuery } from '@/services/cycleService';
import { AddCommitmentSheet } from '@/features/plan/components/AddCommitmentSheet';
import { AddGoalSheet } from '@/features/plan/components/AddGoalSheet';
import { CreateAccountSheet } from '@/features/accounts/components/CreateAccountSheet';
import { CreditCardSheet } from '@/features/cards/components/CreditCardSheet';
import { AddLoanSheet } from '@/features/debts/components/AddLoanSheet';
import { AddInvestmentSheet } from '@/features/investments/components/AddInvestmentSheet';

/**
 * The rail's Add for everything that isn't a transaction (those stay with `AddSheet`).
 * These are the same sheets each page opens from its own button, so both ways of adding
 * a bill, a loan or a goal behave the same. Only the open sheet is mounted, so each one
 * opens blank.
 */
export function PageAddHost() {
  const dispatch = useAppDispatch();
  const pageAdd = useAppSelector((s) => s.ui.pageAdd);
  const close = () => dispatch(closePageAdd());

  // A bill added while viewing another month starts in that month, as the plan's own
  // "+ Add a bill" does.
  const cycleId = pageAdd?.kind === 'bill' ? pageAdd.cycleId : null;
  const { data: cycle, isFetching } = useGetCycleQuery(cycleId ?? 0, { skip: cycleId == null });

  if (!pageAdd) return null;
  switch (pageAdd.kind) {
    case 'bill':
      // Wait for the viewed month so the sheet doesn't open on the wrong start month.
      if (cycleId != null && (isFetching || !cycle)) return null;
      return <AddCommitmentSheet open onClose={close} defaultStart={cycle?.startDate} />;
    case 'account':
      return <CreateAccountSheet open onClose={close} />;
    case 'card':
      return <CreditCardSheet open onClose={close} />;
    case 'loan':
      return <AddLoanSheet open onClose={close} />;
    case 'holding':
      return <AddInvestmentSheet open onClose={close} />;
    case 'goal':
      return <AddGoalSheet open onClose={close} />;
  }
}
