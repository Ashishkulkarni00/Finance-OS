import { useState } from 'react';
import { TabToolbar } from '@/features/money/components/TabToolbar';
import type { ReactNode } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
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
import { InvestmentPlanPrompt } from '@/features/investments/components/InvestmentPlanPrompt';
import { useGetInvestmentsQuery, useGetInvestmentSummaryQuery } from '@/services/investmentService';

/** A full-width hairline above each section - the same separation as every other screen. */
function Divided({ children }: { children: ReactNode }) {
  // `divided`: on a phone the rule goes and the section inside becomes a card (index.css).
  return <div className="divided border-t border-line pt-space-8 empty:hidden max-md:border-t-0 max-md:pt-0">{children}</div>;
}

/**
 * The panel's wash: a light fade of the invest hue at the top, into plain surface. The one
 * screen whose headline is something you've built rather than something to watch gets to
 * look like it - without a single figure changing meaning.
 */
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
    <>
      <TabToolbar subtitle="Money you’ve put to work, where it’s put, and how it’s growing." helpTopic="investments.how-investments-works">
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          <Plus size={14} strokeWidth={1.5} />
          Add a holding
        </Button>
      </TabToolbar>

      {isError ? (
        <ErrorState message="We couldn't load your investments. Check your connection and try again." onRetry={refetch} />
      ) : (
        <>
          <InvestmentStanding summary={summary} isLoading={summaryLoading} />

          <Divided>{isLoading ? <Skeleton className="h-16 w-full rounded-xl" /> : <InvestmentsCheckIn investments={investments} />}</Divided>

          {!isLoading && investments.some((i) => i.monthlyContribution != null && Number(i.monthlyContribution) > 0 && i.payFromAccount != null && i.planCommitmentId == null) && (
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
                <div className="flex flex-col gap-space-5 md:gap-space-8">
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
    </>
  );
}