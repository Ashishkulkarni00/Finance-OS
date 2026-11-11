import { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCashPositionQuery, useGetNetWorthQuery } from '@/services/positionService';
import { NetWorthZone } from '@/features/accounts/components/NetWorthZone';
import { NeedsALookZone } from '@/features/accounts/components/NeedsALookZone';
import { CashBankRegister } from '@/features/accounts/components/CashBankRegister';
import { CreateAccountSheet } from '@/features/accounts/components/CreateAccountSheet';
import { RegistersSummary } from '@/features/money/components/RegistersSummary';
import { TabToolbar } from '@/features/money/components/TabToolbar';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

/**
 * A full-width hairline above each section. `empty:hidden` matters here in a way it
 * doesn't on Months: a register with nothing to show (no cards, no loans) renders
 * null, and a divider over nothing would leave a stray rule on the page.
 */
/**
 * "The Statement" - docs/product/ACCOUNTS_EXPERIENCE.md, docs/design/ACCOUNTS_UX_SPEC.md.
 *
 * <p>Brought in line with Today, the Ledger and Months: a header that names the
 * screen, a "How Accounts works" guide, a dismissible primer, the position as one panel
 * (net worth beside what's in bank and cash), then each register under its own rule.
 *
 * <p>Order: position · needs a look · cash & bank · cards · debts · investments - the
 * spec's, unchanged. What moved is the "Add account" button, from a lone button above
 * the hero into the header beside the guide.
 */
export default function MoneyPage() {
  const { data: accountsPage, isLoading: accountsLoading, isError: accountsError, refetch: refetchAccounts } = useGetAccountsQuery();
  const { data: netWorth, isLoading: netWorthLoading, isError: netWorthError } = useGetNetWorthQuery();
  const { data: cashPosition } = useGetCashPositionQuery();
  const [adding, setAdding] = useState(false);

  const accounts = accountsPage?.content ?? [];

  if (!accountsLoading && !accountsError && accounts.length === 0) {
    return (
      <>
        <EmptyState
          icon={Wallet}
          headline="Nothing here yet."
          body="Add your accounts so Kosh can tell you what's actually yours to spend."
          action={
            <Button variant="secondary" onClick={() => setAdding(true)}>
              <Plus size={16} strokeWidth={1.5} />
              Add an account
            </Button>
          }
        />
        <CreateAccountSheet open={adding} onClose={() => setAdding(false)} />
      </>
    );
  }

  return (
    <>
      <TabToolbar subtitle="What you own, what you owe, and what each account can actually do for you." helpTopic="accounts.how-accounts-works">
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          <Plus size={14} strokeWidth={1.5} />
          Add account
        </Button>
      </TabToolbar>

      <NetWorthZone
        netWorth={netWorth}
        cash={cashPosition}
        accounts={accounts}
        isLoading={netWorthLoading || accountsLoading}
        isError={netWorthError}
      />

      {accountsError ? (
        <ErrorState message="We couldn't load your accounts. Check your connection and try again." onRetry={refetchAccounts} />
      ) : (
        <>
          <NeedsALookZone accounts={accounts} isLoading={accountsLoading} />
          <CashBankRegister accounts={accounts} isLoading={accountsLoading} />
          <RegistersSummary />
        </>
      )}

      <CreateAccountSheet open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
