import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { LedgerRow, MetaFacts } from '@/components/LedgerRow';
import { formatMoney } from '@/lib/money';
import { useOutgoingsByAccount, summariseOutgoings } from '../useOutgoingsByAccount';
import type { AccountResponse } from '@/types/api';

interface CashBankRegisterProps {
  accounts: AccountResponse[];
  isLoading: boolean;
}

/**
 * Names the money that isn't free, in the reservation's own words.
 *
 * <p>"available ₹8,000" against a ₹33,000 balance is a fact with the reason withheld,
 * which reads as arbitrary - the user can't tell whether it's a rule, a mistake, or
 * something they did. The hold carries the reservations' labels, so it can say
 * "Emergency fund" instead of making them go and look.
 */
function heldExplanation(account: AccountResponse): string | undefined {
  const { locked, reserved, minimumHold, reservedFor } = account.hold;
  if (Number(locked) <= 0) return undefined;

  if (reservedFor.length > 0 && Number(reserved) >= Number(minimumHold)) {
    return `${formatMoney(reserved)} held · ${reservedFor.join(' · ')}`;
  }
  if (Number(minimumHold) > 0) {
    return `${formatMoney(minimumHold)} must stay in · bank minimum`;
  }
  return `${formatMoney(locked)} held back`;
}

/**
 * Zone 3 - "yours to spend" register: bank and cash accounts only. Cards, debts and
 * investments have their own zones with their own logic.
 *
 * <p>Every row answers four things the Excel's Accounts sheet answers and a balance
 * column alone cannot: what the account is <em>for</em>, what leaves from it, what the
 * bank holds, and what of that is actually yours. Balance and Available render as two
 * figures whenever they differ - the HDFC Premium case (ACCOUNTS_EXPERIENCE.md §2), where
 * a single number hides that a mandatory minimum has already claimed the money. Equal,
 * they collapse to one: two identical numbers are noise, not information.
 */
export function CashBankRegister({ accounts, isLoading }: CashBankRegisterProps) {
  const outgoings = useOutgoingsByAccount();

  if (isLoading) {
    return (
      <section>
        <SectionHeader>Cash & bank</SectionHeader>
        <Skeleton className="h-24 w-full" />
      </section>
    );
  }

  const cashBank = accounts.filter((a) => (a.type === 'BANK' || a.type === 'CASH') && !a.archived);
  if (cashBank.length === 0) return null;

  return (
    <section>
      <SectionHeader trailing={`${cashBank.length} ${cashBank.length === 1 ? 'account' : 'accounts'}`}>
        Cash & bank
      </SectionHeader>
      <div className="flex flex-col">
        {cashBank.map((account) => {
          const differs = account.available !== account.currentBalance;
          const balanceNegative = Number(account.currentBalance) < 0;
          const held = heldExplanation(account);
          const leaves = summariseOutgoings(outgoings.get(account.id));

          return (
            <LedgerRow
              key={account.id}
              to={`/accounts/${account.id}`}
              primary={account.name}
              secondary={
                balanceNegative ? (
                  // The row's own figure is red; this says why it matters and where the
                  // explanation is, instead of leaving a red number to speak for itself.
                  <span className="text-attention">Below zero · see Needs a look</span>
                ) : (
                  <>
                    {account.institution ?? account.typeLabel}
                    {account.purpose && ` · ${account.purpose}`}
                  </>
                )
              }
              meta={
                <MetaFacts
                  items={[
                    ...(differs
                      ? [
                          {
                            label: 'Available',
                            value: <Amount value={account.available} role="caption" emphasiseNegative />,
                            className: Number(account.available) < 0 ? 'text-critical' : 'text-ink',
                          },
                        ]
                      : []),
                    ...(held ? [{ label: 'Held', value: held }] : []),
                    ...(leaves ? [{ label: 'Pays for', value: leaves }] : []),
                  ]}
                />
              }
              amount={
                <>
                  <Amount
                    value={account.currentBalance}
                    role="row"
                    className={balanceNegative ? undefined : 'text-ink'}
                    emphasiseNegative
                  />
                  {/* Labelled only when there's a second figure to contrast it with. */}
                  {differs && <div className="text-caption text-ink-muted">balance</div>}
                </>
              }
            />
          );
        })}
      </div>
    </section>
  );
}
