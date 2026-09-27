import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HelpSidebar } from './HelpSidebar';
import { sectionHeadingsFor } from './TopicView';
import { useHelp } from '../HelpProvider';
import type { DocTopic } from '../types';

/**
 * The manual's own way back to the product - IN_APP_MANUAL.md §5's "The manual is its
 * own mode": with the app rail gone, this single, unmissable button is what makes
 * hiding it safe. Returns to the last route visited outside `/help/*`, or `/today` if
 * there was none.
 */
function BackToKosh() {
  const navigate = useNavigate();
  const { backTo } = useHelp();
  return (
    <button
      type="button"
      onClick={() => navigate(backTo)}
      className="flex items-center gap-space-2 text-label font-medium text-ink-soft transition-colors duration-150 hover:text-ink"
    >
      <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
      Back to Kosh
    </button>
  );
}

/**
 * The manual's page chrome - IN_APP_MANUAL.md §5's Layout table. Desktop-first, like the
 * rest of the shell (`AppShell.tsx`): the sidebar becomes a `<details>` disclosure below
 * 900px and the right rail folds to the top of the main column below 1280px, but there
 * is no dedicated mobile layout, matching what `AppShell` itself does today.
 */
export function HelpShell({
  activeTopic,
  /** The home page carries its own prominent search, so the sidebar drops its copy there:
   *  two identical inputs side by side on the widest layout read as a bug. Every other
   *  route keeps the sidebar's, so there is always exactly one and it is always findable. */
  searchInSidebar = true,
  children,
}: {
  activeTopic?: DocTopic;
  searchInSidebar?: boolean;
  children: ReactNode;
}) {
  const rightRail = activeTopic && (
    <div className="flex flex-col gap-space-6">
      {sectionHeadingsFor(activeTopic).length > 0 && (
        <div>
          <p className="mb-space-3 text-micro uppercase tracking-[0.08em] text-ink-muted">On this page</p>
          <ul className="flex flex-col gap-space-2">
            {sectionHeadingsFor(activeTopic).map((h) => (
              <li key={h} className="text-caption leading-relaxed text-ink-soft">
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeTopic.seeInApp && activeTopic.seeInApp.length > 0 && (
        <div>
          <p className="mb-space-3 text-micro uppercase tracking-[0.08em] text-ink-muted">See it in the app</p>
          <ul className="flex flex-col gap-space-3">
            {activeTopic.seeInApp.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-caption text-accent underline-offset-2 hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-space-6 min-[900px]:grid min-[900px]:grid-cols-[240px_minmax(0,1fr)] min-[900px]:items-start min-[900px]:gap-space-10 min-[1280px]:grid-cols-[240px_minmax(0,68ch)_1fr]">
      {/* Below 900px: a disclosure above the content, not a column. */}
      <div className="flex flex-col gap-space-4 min-[900px]:hidden">
        <BackToKosh />
        <details className="rounded-lg border border-line bg-surface px-space-4 py-space-3">
          <summary className="cursor-pointer text-label font-medium text-ink">Browse the manual</summary>
          <div className="mt-space-4">
            <HelpSidebar showSearch={searchInSidebar} />
          </div>
        </details>
      </div>
      {/* The hairline is on the columns, not between them: `--line` is the same rule the
          rest of the app separates rows with, and it reads as structure rather than as a
          divider drawn on top of the layout. `self-stretch` makes it run the full height of
          the tallest column instead of stopping at the end of the nav list. */}
      <aside className="hidden min-[900px]:flex min-[900px]:flex-col min-[900px]:gap-space-6 min-[900px]:self-stretch min-[900px]:border-r min-[900px]:border-line min-[900px]:pr-space-6">
        <BackToKosh />
        <div className="border-t border-line pt-space-5">
          <HelpSidebar showSearch={searchInSidebar} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-space-6 min-[1280px]:max-w-[68ch]">
        {/* Below 1280px: the right rail's content sits above the main column instead of beside it. */}
        {rightRail && <div className="min-[1280px]:hidden">{rightRail}</div>}
        {children}
      </div>

      {rightRail && (
        <aside className="hidden min-[1280px]:block min-[1280px]:self-stretch min-[1280px]:border-l min-[1280px]:border-line min-[1280px]:pl-space-6">
          {rightRail}
        </aside>
      )}
    </div>
  );
}
