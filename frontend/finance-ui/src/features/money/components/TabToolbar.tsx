import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { PageHelpButton, PageSubtitle } from '@/features/help/PageHelp';
import type { MoneyOutletContext } from '@/routes/MoneyLayout';

/**
 * The top of every Money tab (UI_UX_REVAMP_PLAN 4.7): what the tab is for in one sentence, with the
 * help icon and the tab's own add button. The page title ("Money") and the tab strip live in
 * `MoneyLayout`, so each tab opens straight onto its answer.
 *
 * <p>The help icon and the add button are portalled into the layout's title row (2026-11-11), so on
 * a phone - where the subtitle is hidden - this renders nothing in the page flow at all and no row
 * is spent on two small controls. Rendered outside the layout it falls back to the old inline row.
 */
export function TabToolbar({
  subtitle,
  helpTopic,
  children,
}: {
  subtitle: string;
  helpTopic: string;
  children?: ReactNode;
}) {
  const ctx = useOutletContext<MoneyOutletContext | undefined>();
  const actions = (
    <>
      <PageHelpButton topic={helpTopic} />
      {children}
    </>
  );

  if (ctx) {
    // The slot is set one commit after the layout mounts; until then there is nothing to render into.
    return (
      <>
        <PageSubtitle>{subtitle}</PageSubtitle>
        {ctx.actionsSlot && createPortal(actions, ctx.actionsSlot)}
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-space-4 gap-y-space-2 max-md:-mb-space-3">
      <PageSubtitle>{subtitle}</PageSubtitle>
      <div className="ml-auto flex shrink-0 items-center gap-space-2">{actions}</div>
    </div>
  );
}
