import { useState } from 'react';
import type { ReactNode } from 'react';
import { CircleHelp, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/Button';
import { AddInvestmentSheet } from '@/features/investments/components/AddInvestmentSheet';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { GroupBand } from '@/components/GroupBand';
import { Amount } from '@/components/Amount';
import { InvestmentStanding } from '@/features/investments/components/InvestmentStanding';
import { InvestmentRow } from '@/features/investments/components/InvestmentRow';
import { InvestmentsCheckIn } from '@/features/investments/components/InvestmentsCheckIn';
import { InvestmentsPrimer } from '@/features/investments/components/InvestmentsPrimer';
import { InvestmentPlanPrompt } from '@/features/investments/components/InvestmentPlanPrompt';
import { InvestmentsGuideSheet } from '@/features/investments/components/InvestmentsGuideSheet';
import { useGetInvestmentsQuery, useGetInvestmentSummaryQuery } from '@/services/investmentService';

/** A full-width hairline above each section - the same separation as every other screen. */
function Divided({ children }: { children: ReactNode }) {
  return <div className="border-t border-line pt-space-8 empty:hidden">{children}</div>;
}

/**
 * The panel's wash: a light fade of the invest hue at the top, into plain surface. The one
 * screen whose headline is something you've built rather than something to watch gets to
 * look like it - without a single figure changing meaning.
 */
const PANEL_WASH = {
  backgroundImage:
    'linear-gradient(180deg, color-mix(in srgb, var(--invest) 7%, var(--surface)) 0%, var(--surface) 70%)',
} as const;

/**
 * "Investments" - money put to work, from the source workbook's Investments sheet, whose
 * rule this page keeps: <em>"Current Value is the only figure you keep updating by hand...
 * Leave it blank and the sheet says so rather than guessing."</em>
 *
 * <p>Brought in line with the other screens - header, guide, primer, one overview panel,
 * sections under rules - but in its own register. Debts and Accounts watch for problems;
 * this screen shows something you've built, so its panel carries the invest hue, its
 * check-in zone is calm blue rather than amber, and its groups are named for what the
 * money is doing: ready if you need it, or growing for later.
 */
export default function InvestmentsPage() {
  const { data: page, isLoading, isError, refetch } = useGetInvestmentsQuery();
  const { data: summary, isLoading: summaryLoading } = useGetInvestmentSummaryQuery();
  const [adding, setAdding] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const investments = page?.content ?? [];
  const ready = investments.filter((i) => i.liquid);
  const forLater = investments.filter((i) => !i.liquid);

  if (!isLoading && !isError && investments.length === 0) {
    return (
      <>
        <EmptyState
          icon={TrendingUp}
          headline="Nothing invested yet."
          body="Add a SIP, a deposit or a fund and this tracks what you've put to work - and how it's growing, whenever you check."
          action={
            <Button variant="secondary" onClick={() => setAdding(true)}>
              <Plus size={16} strokeWidth={1.5} />
              Add a holding
            </Button>
          }
        />
        <AddInvestmentSheet open={adding} onClose={() => setAdding(false)} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-space-8">
      <div className="flex flex-col gap-space-6">
        <div className="flex items-start justify-between gap-space-4">
          <div className="flex flex-col gap-space-1">
            <span className="text-micro uppercase tracking-[0.08em] text-invest">Investments</span>
            <span className="text-title text-ink">Money working for you</span>
            <span className="text-caption text-ink-muted">
              {investments.length > 0 ? `${investments.length} ${investments.length === 1 ? 'holding' : 'holdings'}` : ' '}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-space-4">
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="flex items-center gap-space-1 rounded-md px-space-1 text-caption text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <CircleHelp size={14} strokeWidth={1.5} aria-hidden />
              How Investments works
            </button>
            <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
              <Plus size={14} strokeWidth={1.5} />
              Add a holding
            </Button>
          </div>
        </div>

        <InvestmentsPrimer onOpenGuide={() => setGuideOpen(true)} />
      </div>

      {isError ? (
        <ErrorState message="We couldn't load your investments. Check your connection and try again." onRetry={refetch} />
      ) : (
        <>
          <section aria-label="Money put to work" className="rounded-xl border border-line p-space-6" style={PANEL_WASH}>
            <InvestmentStanding summary={summary} isLoading={summaryLoading} />
          </section>

          <Divided>{isLoading ? <Skeleton className="h-16 w-full rounded-xl" /> : <InvestmentsCheckIn investments={investments} />}</Divided>

          {!isLoading && investments.some((i) => i.monthlyContribution != null && i.payFromAccount != null && i.planCommitmentId == null) && (
            <Divided>
              <InvestmentPlanPrompt investments={investments} />
            </Divided>
          )}

          <Divided>
            <section>
              <SectionHeader trailing={`${investments.length} ${investments.length === 1 ? 'holding' : 'holdings'}`}>
                What you hold
              </SectionHeader>

              {isLoading ? (
                <div className="flex flex-col gap-space-2">
                  {[0, 1].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-space-8">
                  {ready.length > 0 && (
                    <div className="flex flex-col">
                      <GroupBand
                        label="Ready if you need it"
                        count={ready.length}
                        // liquidTotal, not totalInvested: this band used to caption only the
                        // reachable holdings with the total of every holding, locked ones
                        // included.
                        figure={summary && <Amount value={summary.liquidTotal} role="caption" className="text-ink" />}
                        caption="put in"
                      />
                      {ready.map((investment) => (
                        <InvestmentRow key={investment.id} investment={investment} />
                      ))}
                    </div>
                  )}

                  {forLater.length > 0 && (
                    <div className="flex flex-col">
                      <GroupBand
                        label="Growing for later"
                        count={forLater.length}
                        figure={summary && <Amount value={summary.illiquidTotal} role="caption" className="text-ink" />}
                        caption="put in · can’t be reached early"
                      />
                      {forLater.map((investment) => (
                        <InvestmentRow key={investment.id} investment={investment} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </Divided>
        </>
      )}

      <AddInvestmentSheet open={adding} onClose={() => setAdding(false)} />
      <InvestmentsGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
