import { type ReactNode, type MouseEvent } from 'react';
import { Link, type LinkProps, useNavigate } from 'react-router-dom';
import { withViewTransition } from '../viewTransition';

/**
 * A `Link` for navigation *inside* the manual - IN_APP_MANUAL.md §5a's "buttery
 * navigation": every click here runs through `startViewTransition` where the browser
 * supports it. Looks and behaves exactly like `Link` (works without JS, opens in a new
 * tab on a modifier-click) but intercepts a plain left click to add the transition.
 */
export function TopicLink({ to, children, className, onClick }: LinkProps & { children: ReactNode }) {
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    withViewTransition(() => navigate(to));
  };

  return (
    <Link to={to} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
