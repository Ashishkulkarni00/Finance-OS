import { useState, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { search } from '../search';
import { withViewTransition } from '../viewTransition';

/**
 * Client-side search over every topic - IN_APP_MANUAL.md §5. No network call, no
 * debounce needed: the whole index is a few dozen topics, held in memory.
 *
 * <p>§5a's "buttery navigation": results appear in an absolutely-positioned dropdown, so
 * there is never a layout shift as they arrive - the space is reserved by the dropdown
 * being an overlay, not a sibling that pushes content down. `↑`/`↓` move a highlighted
 * result, `Enter` opens it (the first result if none is highlighted yet), `Esc` clears
 * the query.
 */
export function SearchBox({ autoFocus, onNavigate }: { autoFocus?: boolean; onNavigate?: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const navigate = useNavigate();
  const results = search(query);

  const go = (category: string, slug: string) => {
    withViewTransition(() => navigate(`/help/${category}/${slug}`));
    setQuery('');
    setActive(-1);
    onNavigate?.();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) {
      if (e.key === 'Escape') setQuery('');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = results[active] ?? results[0]!;
      go(r.category, r.slug);
    } else if (e.key === 'Escape') {
      setQuery('');
      setActive(-1);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-space-2 rounded-lg border border-border bg-surface px-space-3 py-space-2">
        <Search size={16} strokeWidth={1.75} className="shrink-0 text-ink-muted" aria-hidden />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search the manual…"
          aria-label="Search the manual"
          role="combobox"
          aria-expanded={query.trim() !== ''}
          aria-activedescendant={active >= 0 ? `help-search-result-${active}` : undefined}
          className="w-full min-w-0 bg-transparent text-label text-ink outline-none placeholder:text-ink-muted"
        />
      </div>

      {query.trim() !== '' && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 max-h-80 overflow-y-auto rounded-lg border border-line bg-surface shadow-lg">
          {results.length === 0 ? (
            <p className="px-space-4 py-space-3 text-caption text-ink-muted">Nothing matched "{query}".</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                id={`help-search-result-${i}`}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.category, r.slug)}
                className={`flex w-full flex-col gap-space-1 border-b border-line px-space-4 py-space-3 text-left transition-colors duration-150 last:border-b-0 ${i === active ? 'bg-sunken' : ''}`}
              >
                <span className="text-label text-ink">{r.title}</span>
                <span className="text-caption text-ink-muted">{r.summary}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
