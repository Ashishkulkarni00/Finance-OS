import type { DocBlock, DocTerm, DocTopic } from './types';

/**
 * The retrofit (IN_APP_MANUAL.md §1, §8): "A guide sheet renders its topic's `qa` and
 * `elsewhere` blocks - the fast answer, in context, unchanged for the user. The manual
 * renders the whole topic - every block, for someone reading to learn."
 *
 * <p>Each of the seven guide sheets/primers now reads from one "hub" topic in the content
 * layer (`accounts.how-accounts-works`, `loans.how-debts-works`,
 * `investments.how-investments-works`, `spending.how-the-ledger-works`,
 * `months.how-months-works`, `goals.how-goals-works`, `today.how-today-works`) instead of
 * its own hardcoded `FIGURES`/`CASES`/`ELSEWHERE` arrays, so the two surfaces can't drift.
 * This flattens a topic's sections back to plain blocks by kind - the shape each guide
 * sheet's existing JSX already expects - so the retrofit only changes *where the data
 * comes from*, not how each sheet looks.
 */
function blocksOf(topic: DocTopic): DocBlock[] {
  return topic.sections.flatMap((s) => s.blocks);
}

/** Every `terms` block's items, in the order they appear - a guide sheet's "figures"
 *  table, and a `PagePrimer`'s three headline rules (via `onlyPrimer`). */
export function termsOf(topic: DocTopic, onlyPrimer = false): DocTerm[] {
  const items = blocksOf(topic)
    .filter((b): b is Extract<DocBlock, { kind: 'terms' }> => b.kind === 'terms')
    .flatMap((b) => b.items);
  return onlyPrimer ? items.filter((t) => t.primer) : items;
}

/** Every `qa` block's items - a guide sheet's "If you're wondering…" / "Common mistakes". */
export function qaOf(topic: DocTopic): { question: string; answer: string }[] {
  return blocksOf(topic)
    .filter((b): b is Extract<DocBlock, { kind: 'qa' }> => b.kind === 'qa')
    .flatMap((b) => b.items);
}

/** Every `elsewhere` block's items - a guide sheet's "Not on this screen, on purpose" /
 *  "Related" list. */
export function elsewhereOf(topic: DocTopic): { thing: string; where: string; to?: string }[] {
  return blocksOf(topic)
    .filter((b): b is Extract<DocBlock, { kind: 'elsewhere' }> => b.kind === 'elsewhere')
    .flatMap((b) => b.items);
}

/** Every `callout` block - Ledger's "a loan is never a spending account" and "categories
 *  point one way" boxes now live in the topic rather than the component. */
export function calloutsOf(topic: DocTopic): { tone: 'note' | 'warn'; text: string }[] {
  return blocksOf(topic).filter((b): b is Extract<DocBlock, { kind: 'callout' }> => b.kind === 'callout');
}

/** The full-topic link every retrofitted guide sheet ends with. */
export function fullTopicHref(topic: DocTopic): string {
  return `/help/${topic.category}/${topic.slug}`;
}
