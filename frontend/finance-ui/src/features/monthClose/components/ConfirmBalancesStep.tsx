import { Row } from '@/components/Row';
import { Skeleton } from '@/components/Skeleton';
import { Amount } from '@/components/Amount';
import { useGetAccountsQuery } from '@/services/accountService';

/** Step 1 - a calm eyeball check before anything else. SCREEN_SPECS S6. */
export function ConfirmBalancesStep() {
  const { data: accountsPage, isLoading } = useGetAccountsQuery();
  const accounts = accountsPage?.content ?? [];

  return (
    <div className="flex flex-col gap-space-6">
      <div>
        <h1 className="text-editorial font-serif text-ink">Do these balances look right?</h1>
        <p className="mt-space-2 text-body text-ink-muted">
          A quick check before we close the books on this cycle. If something's off, fix it first - closing writes a
          permanent record.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-space-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {accounts.map((account) => (
            <Row
              key={account.id}
              primary={account.name}
              secondary={account.type.replace(/_/g, ' ').toLowerCase()}
              trailing={<Amount value={account.currentBalance} role="row" className="text-ink" />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
