import type { ReactNode } from 'react';
import { PageHelpButton, PageSubtitle } from '@/features/help/PageHelp';

/**
 * The top of every Money tab (UI_UX_REVAMP_PLAN 4.7): what the tab is for in one sentence, with the
 * help icon and the tab's own add button on the right. The page title ("Money") and the tab strip
 * live in `MoneyLayout`, so each tab opens straight onto its answer.
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
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-space-4 gap-y-space-2 max-md:-mb-space-3">
      <PageSubtitle>{subtitle}</PageSubtitle>
      <div className="ml-auto flex shrink-0 items-center gap-space-2">
        <PageHelpButton topic={helpTopic} />
        {children}
      </div>
    </div>
  );
}
