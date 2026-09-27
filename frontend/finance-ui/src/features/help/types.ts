/**
 * The in-app manual's content model - `docs/design/IN_APP_MANUAL.md` §3, §5a.
 *
 * <p>Plain data, no MDX, no build step. A guide sheet and the manual both render from
 * these same topics (§1's "one source, two surfaces"), so the two can't drift.
 */

export type DocTopicId = string; // 'loans.adding-a-loan'
export type DocCategoryId = string; // 'loans'

export type DocBlock =
  | { kind: 'prose'; text: string }
  | { kind: 'steps'; items: string[] }
  | { kind: 'fields'; intro?: string; items: DocField[] }
  | { kind: 'qa'; items: { question: string; answer: string }[] }
  | { kind: 'terms'; items: DocTerm[] }
  | { kind: 'example'; title: string; lines: { label: string; value: string }[]; note?: string }
  | { kind: 'callout'; tone: 'note' | 'warn'; text: string }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'elsewhere'; items: { thing: string; where: string; to?: string }[] };

export interface DocTerm {
  term: string;
  means: string;
  /** Also worth showing in the compact page primer strip (`PagePrimer`) - the retrofit's
   *  "a primer's term -> means pairs come from the topic's terms block" (§1, §8). A hub
   *  topic's terms block can carry more entries than a primer has room for; this marks
   *  which ones earn a place there. Unmarked entries still render in the full manual and
   *  in a guide sheet's own "words you'll see" table. */
  primer?: boolean;
}

export interface DocField {
  /** The exact label on screen. If it changes in the form, it changes here. */
  label: string;
  what: string;
  whereToFind?: string;
  example?: string;
  requirement: 'required' | 'optional' | 'auto';
}

/**
 * The fixed vocabulary every feature topic's sections are drawn from, in this order
 * (IN_APP_MANUAL.md §5a "Standardised structure"). A topic supplies the sections that
 * apply to it and omits the rest, but never reorders them and never invents a heading -
 * `content/index.ts` enforces both at module load.
 */
export const SECTION_HEADINGS = [
  'What is this?',
  'Why use it?',
  'What do I enter?',
  'How do I fill it?',
  'After you save',
  'How this helps',
  'Common mistakes',
  'Related',
] as const;

export type DocSectionHeading = (typeof SECTION_HEADINGS)[number];

export interface DocSection {
  heading: DocSectionHeading;
  blocks: DocBlock[];
}

export interface DocTopic {
  id: DocTopicId;
  category: DocCategoryId;
  /** Route slug. Full path is /help/<category>/<slug>. */
  slug: string;
  title: string;
  /** One sentence. Used on the category index, in search results, and as the overlay's
   *  subtitle. Must stand alone. */
  summary: string;
  /** Ordered position in the Start Here path, if it is on it. */
  startHereStep?: number;
  /** Replaces Phase A's flat `blocks` array - explicit sections, not positionally
   *  inferred (IN_APP_MANUAL.md §5a). */
  sections: DocSection[];
  /**
   * Marks a topic as exempt from the "every topic needs a worked example" rule
   * (IN_APP_MANUAL.md §5a) - a deliberate act, not a default. `content/index.ts`'s
   * `validateSections` throws on any topic with neither an `example` block nor this flag,
   * so a topic can't quietly ship without one just because nobody thought of one.
   */
  definitional?: true;
  related: DocTopicId[];
  /** Deep links into the product this topic describes. */
  seeInApp?: { label: string; to: string }[];
}

export interface DocCategory {
  id: DocCategoryId;
  title: string;
  /** One sentence, shown on the category grid and in the sidebar tree. */
  summary: string;
}
