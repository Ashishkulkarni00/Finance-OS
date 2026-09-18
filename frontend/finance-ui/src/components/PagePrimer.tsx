import { useState } from 'react';
import { X } from 'lucide-react';

interface PagePrimerProps {
  /** Where "dismissed" is remembered. One key per page. */
  storageKey: string;
  headline: string;
  detail: string;
  /** Three at most - the ones that account for most of the confusion on that page. */
  rules: { term: string; means: string }[];
  guideLabel: string;
  onOpenGuide: () => void;
}

function readDismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    // A browser refusing site data is not a reason to hide the explanation.
    return false;
  }
}

/**
 * The one-sentence version of a page, on the page rather than behind a link.
 *
 * <p>Built first for the Ledger, whose "What goes here?" link was 12px grey text in a
 * corner and did not get read - help that is the quietest thing on screen, and costs a
 * click to find out whether it's worth a click, doesn't land. Today and Months
 * followed; a third copy was the point to make it one component so the three can't drift.
 *
 * <p>Dismissible and remembered: once the terms are learned it's clutter. `localStorage`
 * is right for exactly this - a per-browser convenience where being forgotten costs one
 * more dismissal, not data. The full guide stays one click away.
 */
export function PagePrimer({ storageKey, headline, detail, rules, guideLabel, onOpenGuide }: PagePrimerProps) {
  const [dismissed, setDismissed] = useState(() => readDismissed(storageKey));
  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // Dismissed for this session either way.
    }
  };

  return (
    <div className="relative rounded-lg border border-line bg-surface px-space-5 py-space-4">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hide this"
        className="absolute right-space-3 top-space-3 rounded-md p-space-1 text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
      >
        <X size={14} strokeWidth={2} />
      </button>

      <p className="pr-space-6 text-label text-ink">{headline}</p>
      <p className="mt-space-1 text-caption text-ink-muted">{detail}</p>

      <div className="mt-space-3 flex flex-wrap items-center gap-x-space-5 gap-y-space-2">
        {rules.map((r) => (
          <span key={r.term} className="text-caption text-ink-muted">
            <span className="text-ink-soft">{r.term}</span>
            <span aria-hidden> → </span>
            {r.means}
          </span>
        ))}
        <button
          type="button"
          onClick={onOpenGuide}
          className="text-caption text-accent underline-offset-2 transition-colors hover:underline"
        >
          {guideLabel}
        </button>
      </div>
    </div>
  );
}
