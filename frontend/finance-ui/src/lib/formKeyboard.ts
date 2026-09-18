import type { KeyboardEvent } from 'react';

/**
 * Enter advances to the next field instead of submitting the form.
 *
 * <p>HTML's own rule is why this exists: a form with a submit button implicitly submits
 * on Enter in almost any focused text input, regardless of how many other fields sit
 * below it - so the Amount field, which is `autoFocus`ed in every one of these forms,
 * would submit the form the instant someone typed a number and hit Enter out of habit,
 * with Date/Account/Category/Description all still blank.
 *
 * <p>One delegated handler on the `<form>` element, not a per-input `onKeyDown` - a form
 * gains a field, it's covered for free, and the tab order (which this reads from) stays
 * the single source of truth for "what's next" rather than a second, hand-maintained list.
 *
 * <p>Buttons are left alone entirely: a `type="button"` pill (the type selector, the
 * liquid/mandatory toggles) already does the right thing on Enter - it fires its own
 * click - and intercepting that would break selecting an option with the keyboard.
 * Enter on the very last focusable field still submits, which is the one place letting
 * the native behaviour through is exactly what's wanted.
 */
export function handleEnterAdvance(e: KeyboardEvent<HTMLFormElement>) {
  if (e.key !== 'Enter' || e.shiftKey) return;

  const target = e.target as HTMLElement;
  if (target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA') return;

  const form = e.currentTarget;
  const focusable = Array.from(
    form.querySelectorAll<HTMLElement>('input, select, textarea, button[type="submit"]'),
  ).filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.tabIndex < 0) return false;
    // A collapsed FormRow's inputs are still in the DOM in some sheets - skip anything
    // not actually visible rather than silently focusing something the user can't see.
    return el.offsetParent !== null;
  });

  const index = focusable.indexOf(target);
  if (index === -1) return;

  e.preventDefault();
  const next = focusable[index + 1];
  if (next) {
    next.focus();
    if (next instanceof HTMLInputElement && next.type !== 'date') {
      next.select();
    }
  } else {
    form.requestSubmit();
  }
}
