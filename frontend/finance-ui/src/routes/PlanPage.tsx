import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { PageHelpButton, PageSubtitle } from '@/features/help/PageHelp';
import { GoalsSection } from '@/features/plan/components/GoalsSection';
import { AddGoalSheet } from '@/features/plan/components/AddGoalSheet';
import { AheadForecast } from '@/features/ahead/components/AheadForecast';

/**
 * Goals - "what am I saving towards, and what can my money do next?" (UI_UX_REVAMP_PLAN 4.9).
 *
 * <p>Goals first, each with its verdict (the server's feasibility judgement, in its own words), then
 * what is freeing up, then the tools - a suggested order, where freed money could go, a lump sum,
 * and the months ahead - all closed until asked for. Route stays `/ahead`: `/goals/:id` is a goal's
 * own page, so `/goals` cannot also be this page's address (it redirects here).
 */
export default function PlanPage() {
  const [adding, setAdding] = useState(false);

  return (
    <div className="reveal-shell flex w-full flex-col gap-10">
      <header className="flex flex-col gap-space-1">
        <div className="flex items-center justify-between gap-space-4">
          <h1 className="text-page text-ink">Goals</h1>
          <div className="flex shrink-0 items-center gap-space-2">
            <PageHelpButton topic="goals.how-goals-works" />
            <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
              <Plus size={14} strokeWidth={1.5} />
              Add a goal
            </Button>
          </div>
        </div>
        <PageSubtitle>What you’re saving towards, how far you’ve got, and what it takes each month.</PageSubtitle>
      </header>

      <GoalsSection onAdd={() => setAdding(true)} />

      <AheadForecast />

      <AddGoalSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
