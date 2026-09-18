import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { useGetDebitCardsQuery } from '@/services/cardService';
import type { DebitCardResponse } from '@/types/card';
import { DebitCardSheet } from './DebitCardSheet';

/** The debit cards that spend from one bank account - a line under the account's name. */
export function LinkedDebitCards({ accountId }: { accountId: number }) {
  const { data } = useGetDebitCardsQuery();
  const [sheet, setSheet] = useState<{ card: DebitCardResponse | null } | null>(null);
  const cards = (data ?? []).filter((c) => c.account.id === accountId);

  return (
    <div className="flex flex-wrap items-center gap-x-space-3 gap-y-space-1 text-caption text-ink-muted">
      <CreditCard size={13} strokeWidth={1.5} aria-hidden />
      {cards.length === 0 ? (
        <span>No debit card recorded</span>
      ) : (
        cards.map((c) => (
          <button key={c.id} type="button" onClick={() => setSheet({ card: c })} className="rounded-sm transition-colors hover:text-ink">
            {c.name}
            {c.lastFour ? ` •• ${c.lastFour}` : ''}
          </button>
        ))
      )}
      <button type="button" onClick={() => setSheet({ card: null })} className="text-accent hover:underline">
        + Add debit card
      </button>
      {sheet && <DebitCardSheet open card={sheet.card} defaultAccountId={accountId} onClose={() => setSheet(null)} />}
    </div>
  );
}
