import { useState } from 'react';
import type { ReactNode } from 'react';
import { CircleHelp, Plus, Wallet } from 'lucide-react';
import { useGetAccountsQuery } from '@/services/accountService';
import { useGetCashPositionQuery, useGetNetWorthQuery } from '@/services/positionService';
import { NetWorthZone } from '@/features/accounts/components/NetWorthZone';
import { NeedsALookZone } from '@/features/accounts/components/NeedsALookZone';
import { CashBankRegister } from '@/features/accounts/components/CashBankRegister';
import { InvestmentsRegister } from '@/features/accounts/components/InvestmentsRegister';
import { CreateAccountSheet } from '@/features/accounts/components/CreateAccountSheet';
import { AccountsPrimer } from '@/features/accounts/components/AccountsPrimer';
import { AccountsGuideSheet } from '@/features/accounts/components/AccountsGuideSheet';
import { CardsSection } from '@/features/money/components/CardsSection';
import { DebtsSection } from '@/features/money/components/DebtsSection';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

/**
 * A full-width hairline above each section. `empty:hidden` matters here in a way it
 * doesn't on Months: a register with nothing to show (no cards, no loans) renders
 * null, and a divider over nothing would leave a stray rule on the page.
 */
function Divided({ children }: { children: ReactNode }) {
  return <div className="border-t border-line pt-space-8 empty:hidden">{children}</div>;
}

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
  const [guideOpen, setGuideOpen] = useState(false);

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
    <div className="flex flex-col gap-space-8">
      <div className="flex flex-col gap-space-6">
        <div className="flex items-start justify-between gap-space-4">
          <div className="flex flex-col gap-space-1">
            <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Accounts</span>
            <span className="text-title text-ink">What you own and owe</span>
            <span className="text-caption text-ink-muted">Balances as of today</span>
          </div>
          <div className="flex shrink-0 items-center gap-space-4">
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="flex items-center gap-space-1 rounded-md px-space-1 text-caption text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <CircleHelp size={14} strokeWidth={1.5} aria-hidden />
              How Accounts works
            </button>
            <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
              <Plus size={14} strokeWidth={1.5} />
              Add account
            </Button>
          </div>
        </div>

        <AccountsPrimer onOpenGuide={() => setGuideOpen(true)} />
      </div>

      <section aria-label="Your position" className="rounded-xl border border-line bg-surface p-space-6">
        <NetWorthZone
          netWorth={netWorth}
          cash={cashPosition}
          accounts={accounts}
          isLoading={netWorthLoading || accountsLoading}
          isError={netWorthError}
        />
      </section>

      {accountsError ? (
        <ErrorState message="We couldn't load your accounts. Check your connection and try again." onRetry={refetchAccounts} />
      ) : (
        <>
          <Divided>
            <NeedsALookZone accounts={accounts} isLoading={accountsLoading} />
          </Divided>

          <Divided>
            <CashBankRegister accounts={accounts} isLoading={accountsLoading} />
          </Divided>

          <Divided>
            <CardsSection />
          </Divided>

          <Divided>
            <DebtsSection />
          </Divided>

          <Divided>
            <InvestmentsRegister />
          </Divided>
        </>
      )}

      <CreateAccountSheet open={adding} onClose={() => setAdding(false)} />
      <AccountsGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
