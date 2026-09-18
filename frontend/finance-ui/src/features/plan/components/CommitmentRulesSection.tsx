import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Repeat } from 'lucide-react';
import { Row } from '@/components/Row';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/StatusPill';
import { Skeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { useGetCommitmentRulesQuery } from '@/services/commitmentRuleService';
import { AddCommitmentSheet } from './AddCommitmentSheet';

const FREQUENCY_LABEL: Record<string, string> = { MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', ANNUAL: 'Annual' };

/** Commitment rules - the engine. SCREEN_SPECS S5 hierarchy #2. Rows open the rule's
 *  own detail page (its why/consequence text and recent occurrences) - viewing, not
 *  editing; a full edit form is still its own, unbuilt scope. */
export function CommitmentRulesSection() {
  const navigate = useNavigate();
  const { data: page, isLoading } = useGetCommitmentRulesQuery();
  const rules = page?.content ?? [];
  const [adding, setAdding] = useState(false);

  const addButton = (
    <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-space-1 text-accent hover:underline">
      <Plus size={14} strokeWidth={1.5} />
      Add
    </button>
  );

  if (isLoading) {
    return (
      <section>
        <Skeleton className="h-24 w-full" />
      </section>
    );
  }

  // Previously returned null with nothing recorded - which hid the only way to record
  // the first one. An empty register still needs its own add affordance.
  if (rules.length === 0) {
    return (
      <section>
        <SectionHeader trailing={addButton}>Commitment rules</SectionHeader>
        <EmptyState
          icon={Repeat}
          headline="Nothing recurring yet."
          body="Rent, an EMI, a subscription - add it once and it appears on Months every cycle, on its own date."
          action={
            <Button variant="secondary" onClick={() => setAdding(true)}>
              <Plus size={16} strokeWidth={1.5} />
              Add a commitment
            </Button>
          }
        />
        <AddCommitmentSheet open={adding} onClose={() => setAdding(false)} />
      </section>
    );
  }

  return (
    <section>
      <SectionHeader trailing={addButton}>Commitment rules · {rules.length} active</SectionHeader>
      <p className="mb-space-3 text-caption text-ink-muted">
        The engine - add a rule here and it generates itself onto Months every cycle.
      </p>
      <div className="flex flex-col">
        {rules.map((rule) => (
          <Row
            key={rule.id}
            domainRule="commit"
            primary={rule.name}
            secondary={
              rule.ifSkipped ?? `${FREQUENCY_LABEL[rule.frequency]} · due the ${rule.dueDay} · ${rule.account.name}`
            }
            onClick={() => navigate(`/commitment-rules/${rule.id}`)}
            trailing={
              <div className="flex items-center gap-space-3">
                {rule.amountType === 'FIXED' ? (
                  <Amount value={rule.fixedAmount} role="row" className="text-ink" />
                ) : (
                  <span className="text-row text-ink-muted">Varies</span>
                )}
                {rule.mandatory && <StatusPill tone="neutral">Mandatory</StatusPill>}
                <ChevronRight size={16} strokeWidth={1.5} className="text-ink-muted" aria-hidden />
              </div>
            }
          />
        ))}
      </div>
      <AddCommitmentSheet open={adding} onClose={() => setAdding(false)} />
    </section>
  );
}
