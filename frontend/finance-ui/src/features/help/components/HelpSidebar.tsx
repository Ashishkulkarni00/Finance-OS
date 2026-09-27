import type { MouseEvent } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CATEGORIES, topicsByCategory } from '../content';
import { SearchBox } from './SearchBox';
import { withViewTransition } from '../viewTransition';
import { cn } from '@/lib/cn';

/** A left click navigates through `startViewTransition` (§5a); a modifier-click (new
 *  tab, etc.) is left completely alone. */
function useTransitionedNavigate() {
  const navigate = useNavigate();
  return (to: string) => (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    withViewTransition(() => navigate(to));
  };
}

/** Search box + the category tree, expandable, current topic marked - IN_APP_MANUAL.md
 *  §5's Layout table. Shared by the home, category and topic pages so it never drifts. */
export function HelpSidebar({ showSearch = true }: { showSearch?: boolean }) {
  const go = useTransitionedNavigate();
  return (
    <div className="flex flex-col gap-space-6">
      {showSearch && <SearchBox />}
      <nav className="flex flex-col gap-space-6">
        {CATEGORIES.map((category) => {
          const topics = topicsByCategory(category.id);
          return (
            <div key={category.id}>
              <NavLink
                to={`/help/${category.id}`}
                onClick={go(`/help/${category.id}`)}
                className={({ isActive }) =>
                  cn(
                    'block text-label font-medium transition-colors duration-150',
                    isActive ? 'text-accent' : 'text-ink hover:text-accent',
                  )
                }
              >
                {category.title}
              </NavLink>
              <ul className="mt-space-3 flex flex-col gap-space-2 border-l border-line pl-space-3">
                {topics.map((topic) => (
                  <li key={topic.id}>
                    <NavLink
                      to={`/help/${category.id}/${topic.slug}`}
                      onClick={go(`/help/${category.id}/${topic.slug}`)}
                      className={({ isActive }) =>
                        cn(
                          'block text-caption leading-relaxed transition-colors duration-150',
                          isActive ? 'font-medium text-accent' : 'text-ink-soft hover:text-ink',
                        )
                      }
                    >
                      {topic.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
