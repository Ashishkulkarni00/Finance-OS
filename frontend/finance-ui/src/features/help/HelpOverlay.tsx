import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { BookOpen, X } from 'lucide-react';
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
        <p className="mb-space-3 text-micro uppercase tracking-[0.08em] text-ink-muted">Start here</p>
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
        <p className="mb-space-3 text-micro uppercase tracking-[0.08em] text-ink-muted">Categories</p>
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
 * <p>Owns its own scroll container (`overflow-y-auto` on the panel body) and locks the
 * body while open, so a trackpad flick inside it can never bleed into `<main>` - the
 * shell's own scroll container is `<main>`, not the document (`AppShell.tsx`).
 */
export function HelpOverlay({ topicId, onClose, onNavigate }: HelpOverlayProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const topic = topicId === HELP_HOME ? undefined : byId[topicId];
  const title = topicId === HELP_HOME ? 'Help' : (topic?.title ?? 'Help');
  const fullManualHref = topic ? `/help/${topic.category}/${topic.slug}` : '/help';

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className="help-overlay-panel flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-space-5 py-space-4">
          <span className="flex items-center gap-space-2 text-label font-medium text-ink">
            <BookOpen size={16} strokeWidth={1.75} className="text-accent" aria-hidden />
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className="rounded-full p-space-1 text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-ink"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-space-5 py-space-5">
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
        </div>

        <div className="shrink-0 border-t border-line px-space-5 py-space-3">
          <Link to={fullManualHref} onClick={onClose} className="text-caption text-accent underline-offset-2 hover:underline">
            Open in the full manual
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
