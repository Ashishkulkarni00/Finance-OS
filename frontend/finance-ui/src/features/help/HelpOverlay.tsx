import { Link } from 'react-router-dom';
import { Sheet } from '@/components/Sheet';
import { TopicView } from './components/TopicView';
import { SearchBox } from './components/SearchBox';
import { CATEGORIES, START_HERE, byId, topicsByCategory } from './content';
import { HELP_HOME } from './HelpProvider';

function HomeMini({ onNavigate }: { onNavigate: (topicId: string) => void }) {
  return (
    <div className="flex flex-col gap-space-6">
      <p className="text-body text-ink-soft">
        Kosh keeps one number: what you can actually spend, once every bill still due is accounted for. Start here, or
        search for anything.
      </p>
      <SearchBox />
      <div>
        <p className="mb-space-3 text-caption text-ink-muted">Start here</p>
        <ol className="flex flex-col gap-space-2">
          {START_HERE.map((topic, i) => (
            <li key={topic.id}>
              <button
                type="button"
                onClick={() => onNavigate(topic.id)}
                className="flex w-full items-start gap-space-2 rounded-md px-space-1 py-space-1 text-left transition-colors duration-150 hover:bg-sunken"
              >
                <span className="num mt-0.5 text-caption text-ink-muted">{i + 1}.</span>
                <span className="text-label text-ink">{topic.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p className="mb-space-3 text-caption text-ink-muted">Categories</p>
        <div className="flex flex-wrap gap-space-2">
          {CATEGORIES.map((c) => (
            <span key={c.id} className="rounded-full border border-line px-space-3 py-space-1 text-caption text-ink-soft">
              {c.title} · {topicsByCategory(c.id).length}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

interface HelpOverlayProps {
  open: boolean;
  /** A `DocTopicId`, or the `HELP_HOME` sentinel for the manual's own home. */
  topicId: string;
  onClose: () => void;
  onNavigate: (topicId: string) => void;
}

/**
 * The overlay mode - IN_APP_MANUAL.md §2. Rendered as a sibling of the page by
 * `HelpProvider`, which wraps `<AppShell>`'s whole tree, so the page underneath is never
 * unmounted: closing this is simply removing `?help=`, nothing to restore.
 *
 * <p>Built on `Sheet` (UI_UX_REVAMP_PLAN Phase 4), so it is a real modal dialog: it opens above any
 * sheet already on screen, the page behind is inert, Esc and the backdrop close it, focus lands on
 * its title and returns to whatever opened it, and the sheet animates (or not, under reduced
 * motion). It stays mounted while closing so that exit and focus-return can run.
 */
export function HelpOverlay({ open, topicId, onClose, onNavigate }: HelpOverlayProps) {
  const topic = topicId === HELP_HOME ? undefined : byId[topicId];
  const title = topicId === HELP_HOME ? 'Help' : (topic?.title ?? 'Help');
  const fullManualHref = topic ? `/help/${topic.category}/${topic.slug}` : '/help';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      guardDirty={false}
      footer={
        <Link to={fullManualHref} onClick={onClose} className="text-caption text-accent underline-offset-2 hover:underline">
          Open in the full manual
        </Link>
      }
    >
      {topicId === HELP_HOME ? (
        <HomeMini onNavigate={onNavigate} />
      ) : topic ? (
        <TopicView topic={topic} headingLevel="none" />
      ) : (
        <div className="flex flex-col gap-space-3">
          <p className="text-body text-ink-soft">This part of the manual is still being written.</p>
          <Link to="/help" onClick={onClose} className="text-caption text-accent underline-offset-2 hover:underline">
            Go to the manual’s home instead
          </Link>
        </div>
      )}
    </Sheet>
  );
}
