import { formatMoney } from '@/lib/money';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Statement, StatementRow } from '@/components/Statement';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/lib/cn';
import type { PositionResponse } from '@/types/position';

interface PositionStatementProps {
  position: PositionResponse | undefined;
  isLoading: boolean;
}

/**
 * The product's core equation, shown as a derivation rather than a result:
 *
 *   held − reserved − committed − owed on credit cards = REAL BALANCE
 *
 * SCREEN_SPECS S1 #5 calls this the thing that "teaches the three states of money
 * every time it is glanced at" - which a single collapsed line cannot do. Showing the
 * working is also what makes the figure trustworthy (DESIGN_SYSTEM §12 rule 10).
 */
export function PositionStatement({ position, isLoading }: PositionStatementProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <section>
        <SectionHeader>Where you stand</SectionHeader>
        <Skeleton className="h-40 w-full" />
      </section>
    );
  }

  if (!position || position.state !== 'OK') return null;

  const { breakdown } = position;
  const hasDetail = breakdown.accounts.length > 0 || breakdown.commitments.length > 0 || breakdown.cards.length > 0;
  // A comparison, not arithmetic. Any account below zero is pulling Held down - which is
  // right for an overdraft and wrong for a loan that was added as a bank account, and the
  // page can't tell which. So it opens the detail and says so, rather than guessing.
  const anyBelowZero = breakdown.accounts.some((a) => Number(a.balance) < 0);
  const showDetail = expanded || anyBelowZero;

  return (
    <section>
      <SectionHeader
        trailing={
          hasDetail &&
          !anyBelowZero && (
            // A real control with a chevron, not a bare grey word - "Show detail" read as
            // a label, and nothing about it said it would open anything.
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-space-1 rounded-md px-space-1 text-caption text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              {expanded ? 'Hide accounts and bills' : 'Show accounts and bills'}
              <ChevronDown
                size={13}
                strokeWidth={1.75}
                aria-hidden
                className={cn('transition-transform duration-150', expanded && 'rotate-180')}
              />
            </button>
          )
        }
      >
        Where you stand
      </SectionHeader>

      <Statement notes>
        <StatementRow label="Held across accounts" value={breakdown.held} note="Bank and cash only - not cards, loans or investments." />
        {showDetail &&
          breakdown.accounts.map((a) => (
            <StatementRow
              key={a.accountId}
              indent
              label={a.name}
              value={a.balance}
              emphasiseNegative
              note={
                Number(a.balance) < 0 ? (
                  <span className="text-attention">
                    Below zero, so it reduces your spending money. If this is a loan, add it under Debts instead.
                  </span>
                ) : undefined
              }
            />
          ))}

        <StatementRow label="Reserved" value={breakdown.reserved} deduct note="Set aside for something specific. Not yours to spend." />

        <StatementRow
          label="Committed"
          value={breakdown.committed}
          deduct
          note={
            Number(breakdown.optionalCommitted) > 0
              ? `Bills still to leave before your next salary, including ${formatMoney(breakdown.optionalCommitted)} of optional ones you could skip.`
              : 'Bills still to leave before your next salary.'
          }
        />
        {showDetail &&
          breakdown.commitments.map((c) => (
            <StatementRow key={c.commitmentInstanceId} indent label={c.mandatory ? c.name : `${c.name} (optional)`} value={c.outstanding} />
          ))}

        {/* A comparison, not arithmetic. Hidden when nothing is owed on any card. */}
        {Number(breakdown.cardDues) > 0 && (
          <StatementRow
            label="Owed on credit cards"
            value={breakdown.cardDues}
            deduct
            note="Already spent on cards. Paying the bill moves money, it doesn't spend it again."
          />
        )}
        {showDetail &&
          breakdown.cards.map((c) => <StatementRow key={c.accountId} indent label={c.name} value={c.balance} />)}

        <StatementRow variant="total" label="Free until salary" value={position.realBalance} emphasiseNegative note="What is genuinely yours to decide about." />
      </Statement>
    </section>
  );
}
