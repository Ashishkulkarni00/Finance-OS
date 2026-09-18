/** Tiny classname joiner - no need for a dependency for this. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
