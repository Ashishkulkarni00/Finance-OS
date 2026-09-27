/**
 * Tags an element as documented. `HelpProvider`'s single `contextmenu`/long-press/`?`
 * listener looks for the nearest `[data-doc]` ancestor and resolves the key through
 * `contextMap.ts` - the element itself knows nothing about topics or routes.
 *
 * ```tsx
 * const docProps = useDocAnchor('loan.emi');   // -> { 'data-doc': 'loan.emi' }
 * <div {...docProps}>…</div>
 * ```
 */
export function useDocAnchor(key: string): { 'data-doc': string } {
  return { 'data-doc': key };
}
