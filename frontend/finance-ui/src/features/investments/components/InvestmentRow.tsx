import { useState } from 'react';
import { Amount } from '@/components/Amount';
import { Button } from '@/components/Button';
import { LedgerRow, DomainRule, MetaFacts } from '@/components/LedgerRow';
import { formatPercent } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import { useRecordValuationMutation } from '@/services/investmentService';
import { cn } from '@/lib/cn';
import type { InvestmentResponse } from '@/types/investment';
import { EditInvestmentSheet } from './EditInvestmentSheet';

/** Beyond this, a valuation is old enough that presenting it as "what it's worth" would
 *  be overstating what we know. Three months is one quarter's statement. */
const STALE_AFTER_DAYS = 92;

function ordinalDay(day: number): string {
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix}`;
}

/**
 * The gain line. Three genuinely different states, and collapsing any two of them is how
 * a register starts lying: never valued (say so), valued and stale (say how old), valued
 * and current (state the gain).
 */
function GainLine({ investment }: { investment: InvestmentResponse }) {
  if (investment.currentValue == null) {
    return <span className="text-ink-muted">Not valued yet · add what it’s worth to see how it’s grown</span>;
  }

  const stale = (investment.valuationAgeDays ?? 0) > STALE_AFTER_DAYS;
  const up = investment.gain != null && Number(investment.gain) >= 0;

  return (
    <span className={cn('num', up ? 'text-positive' : 'text-critical')}>
      {up ? '+' : ''}
      <Amount value={investment.gain} role="caption" className={up ? 'text-positive' : 'text-critical'} />
      {investment.gainPercent != null && ` · ${formatPercent(investment.gainPercent)}`}
      {investment.currentValueAsOf && (
        <span className={stale ? 'text-attention' : 'text-ink-muted'}>
          {' · as at '}
          {formatShortDate(investment.currentValueAsOf)}
          {stale && ' (worth a refresh)'}
        </span>
      )}
    </span>
  );
}

/**
 * One holding. The headline figure is what has gone <em>in</em>, not what it's worth -
 * that's the figure we can always stand behind, from real postings where there's an
 * account. What it's worth sits beside it only once someone has actually said.
 *
 * <p>The row carries its own "record what it's worth" action, because that is the single
 * thing this screen asks of the user and burying it behind a detail page would make the
 * honest path the inconvenient one.
 */
export function InvestmentRow({ investment }: { investment: InvestmentResponse }) {
  const [editing, setEditing] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [value, setValue] = useState('');
  const [recordValuation, { isLoading }] = useRecordValuationMutation();

  const save = async () => {
    if (!/^\d+(\.\d{1,2})?$/.test(value)) return;
    await recordValuation({ id: investment.id, body: { currentValue: value } }).unwrap();
    setEditing(false);
    setValue('');
  };

  return (
    <LedgerRow
      // There is no /investments/:id page - the row used to link to one, so every click
      // (here and on Accounts) went to a route nothing renders. A holding with a ledger
      // account opens its contributions in the Ledger; one kept outside the ledger (an
      // employer-deducted NPS) has no entries to show, so its click opens the one thing
      // it can do: record what it's worth.
      // Two buttons need more than the default 5.5rem action column, or they overflow left
      // and sit on top of the amount. Same width as WorklistRow's Skip + Settle pair.
      actionWidth="7.5rem"
      to={investment.account ? `/ledger?account=${investment.account.id}&cycle=all` : undefined}
      onClick={investment.account ? undefined : () => setEditing(true)}
      leading={<DomainRule domain="invest" />}
      primary={
        <span className="flex items-center gap-space-2">
          {investment.name}
          {!investment.liquid && (
            <span
              title="Not money you could reach if you needed it - deliberately kept out of what's safe to spend."
              className="shrink-0 cursor-pointer rounded-full border border-border px-space-2 py-[2px] text-micro text-ink-muted"
            >
              Locked away
            </span>
          )}
        </span>
      }
      secondary={<GainLine investment={investment} />}
      meta={
        <MetaFacts
          items={[
            { label: 'Type', value: investment.typeLabel },
            ...(investment.monthlyContribution
              ? [
                  {
                    label: 'Monthly',
                    value: (
                      <>
                        <Amount value={investment.monthlyContribution} role="caption" />
                        {investment.contributionDay && ` on the ${ordinalDay(investment.contributionDay)}`}
                      </>
                    ),
                  },
                ]
              : []),
            {
              label: 'From',
              value: investment.payFromAccount?.name ?? (investment.outsideLedger ? 'employer' : 'not recorded'),
              className: investment.payFromAccount ? undefined : 'text-ink-soft italic',
            },
          ]}
        />
      }
      amount={
        <>
          <Amount value={investment.totalInvested} role="row" className="text-ink" />
          <div className="text-caption text-ink-muted">
            {investment.currentValue != null ? (
              <>
                worth <Amount value={investment.currentValue} role="caption" />
              </>
            ) : (
              'put in'
            )}
          </div>
        </>
      }
      action={
        editing ? (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') setEditing(false);
            }}
            placeholder="₹"
            disabled={isLoading}
            className="num h-8 w-full rounded-md border border-accent bg-surface px-space-2 text-caption text-ink outline-none"
          />
        ) : (
          <span className="flex items-center gap-space-2">
            <Button size="sm" variant="ghost" onClick={() => setEditingDetails(true)}>
              Edit
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              Value
            </Button>
            {editingDetails && (
              // Keyed so each opening starts from the holding's saved values.
              <EditInvestmentSheet key={investment.id} investment={investment} open onClose={() => setEditingDetails(false)} />
            )}
          </span>
        )
      }
    />
  );
}
