import type { DocCategory, DocTopic, DocTopicId } from '../types';
import { SECTION_HEADINGS } from '../types';
import { GETTING_STARTED_TOPICS } from './getting-started';
import { ACCOUNTS_TOPICS } from './accounts';
import { INCOME_TOPICS } from './income';
import { MONTHLY_PLAN_TOPICS } from './monthly-plan';
import { SPENDING_TOPICS } from './spending';
import { TODAY_TOPICS } from './today';
import { MONTHS_TOPICS } from './months';
import { ATTENTION_TOPICS } from './attention';
import { LOANS_TOPICS } from './loans';
import { CARDS_TOPICS } from './cards';
import { GOALS_TOPICS } from './goals';
import { COVER_TOPICS } from './cover';
import { INVESTMENTS_TOPICS } from './investments';
import { CORRECTIONS_TOPICS } from './corrections';
import { CALCULATIONS_TOPICS } from './calculations';
import { FAQ_TOPICS } from './faq';
import { TROUBLESHOOTING_TOPICS } from './troubleshooting';

/**
 * Every category the manual browses by (home grid, sidebar tree) - IN_APP_MANUAL.md §8.
 * Phase A shipped the first six; Phase B promotes the three seeds (`months`, `attention`,
 * `loans` - each had one topic written only so a required `data-doc` anchor resolved to
 * something real) into full categories and adds the seven named in §8's Phase B list.
 */
export const CATEGORIES: DocCategory[] = [
  { id: 'getting-started', title: 'Getting started', summary: 'What Kosh does, and the one idea - salary to salary - that everything else builds on.' },
  { id: 'accounts', title: 'Accounts', summary: 'Bank accounts, cash, loans and investments - what you own, what you owe, and adding each one.' },
  { id: 'income', title: 'Income', summary: 'Adding your salary, and how expected income differs from money that has actually arrived.' },
  { id: 'monthly-plan', title: 'Monthly plan', summary: 'Rent, EMIs, subscriptions and family support - adding a commitment once and settling it each month.' },
  { id: 'spending', title: 'Recording expenses', summary: 'The Add button: expenses, income, transfers and investments, and the one mistake worth avoiding.' },
  { id: 'today', title: 'Today', summary: 'What you can spend right now, and a fair share for today out of what is left until salary.' },
  { id: 'months', title: 'Monthly overview', summary: 'Reading a whole salary cycle at a glance - the month line, the plan, day-to-day spending, and closing a month.' },
  { id: 'attention', title: 'Alerts & overdue', summary: 'What "Needs you" actually lists, why it stays short, and how to act on or dismiss what it raises.' },
  { id: 'loans', title: 'Loans & EMIs', summary: 'Every loan you are paying off, what an EMI is, what is still owed, and adding one.' },
  { id: 'cards', title: 'Credit cards', summary: 'A credit card as its own account, its statement and bill, available credit, and adding one.' },
  { id: 'goals', title: 'Goals & emergency fund', summary: 'Saving towards something with a target and a date, and building an emergency fund.' },
  { id: 'cover', title: 'Cover', summary: 'What you are insured for, what it costs, and why cover is never counted as money you have.' },
  { id: 'investments', title: 'SIPs & RDs', summary: 'What you have put to work, adding a SIP or RD, and telling Kosh what a holding is worth.' },
  { id: 'corrections', title: 'Editing and correcting mistakes', summary: 'Fixing an entry, a bill or a balance - and why nothing in Kosh is ever destroyed, only corrected.' },
  { id: 'calculations', title: 'How figures are worked out', summary: 'Where the big numbers come from, why some show "—" instead of a guess, and why nothing is stored twice.' },
  { id: 'faq', title: 'FAQ', summary: 'Quick answers to the questions new users ask most.' },
  { id: 'troubleshooting', title: 'Troubleshooting', summary: 'A number does not look right - what to check, in the order to check it.' },
];

/** Every topic, across every category. One array is the whole content layer's source of
 *  truth (IN_APP_MANUAL.md §1). */
export const TOPICS: DocTopic[] = [
  ...GETTING_STARTED_TOPICS,
  ...ACCOUNTS_TOPICS,
  ...INCOME_TOPICS,
  ...MONTHLY_PLAN_TOPICS,
  ...SPENDING_TOPICS,
  ...TODAY_TOPICS,
  ...MONTHS_TOPICS,
  ...ATTENTION_TOPICS,
  ...LOANS_TOPICS,
  ...CARDS_TOPICS,
  ...GOALS_TOPICS,
  ...COVER_TOPICS,
  ...INVESTMENTS_TOPICS,
  ...CORRECTIONS_TOPICS,
  ...CALCULATIONS_TOPICS,
  ...FAQ_TOPICS,
  ...TROUBLESHOOTING_TOPICS,
];

/**
 * The standardised-structure check (IN_APP_MANUAL.md §5a): "a lint-style check in
 * `content/index.ts` enforces the order and fails the build on a topic that invents a
 * heading or reorders them." Thrown at module load, so a bad topic breaks `vite build`
 * and every dev screen immediately - a real failure, not a console warning.
 */
function validateSections(): void {
  const order = new Map(SECTION_HEADINGS.map((h, i) => [h, i]));
  for (const topic of TOPICS) {
    if (topic.sections.length === 0) {
      throw new Error(`[help] "${topic.id}" has no sections.`);
    }
    let last = -1;
    const seen = new Set<string>();
    for (const section of topic.sections) {
      const pos = order.get(section.heading);
      if (pos === undefined) {
        throw new Error(
          `[help] "${topic.id}" uses heading "${section.heading}", which is not in SECTION_HEADINGS. ` +
            `Every topic's sections must come from the fixed vocabulary in features/help/types.ts.`,
        );
      }
      if (seen.has(section.heading)) {
        throw new Error(`[help] "${topic.id}" repeats the heading "${section.heading}" - each heading may appear at most once.`);
      }
      seen.add(section.heading);
      if (pos <= last) {
        throw new Error(
          `[help] "${topic.id}" has "${section.heading}" out of order - SECTION_HEADINGS fixes the order every topic must follow.`,
        );
      }
      last = pos;
      if (section.blocks.length === 0) {
        throw new Error(`[help] "${topic.id}"'s "${section.heading}" section has no blocks.`);
      }
    }
    // §5a: "Every topic that describes a form must carry What do I enter? and How do I
    // fill it?." Enforced one-directionally - a fields list with nowhere describing how
    // to fill it in is the real defect; a plain action (no fields to list) can still use
    // "How do I fill it?" for its steps without inventing a fields section to match.
    const hasFields = topic.sections.some((s) => s.heading === 'What do I enter?');
    const hasSteps = topic.sections.some((s) => s.heading === 'How do I fill it?');
    if (hasFields && !hasSteps) {
      throw new Error(
        `[help] "${topic.id}" has "What do I enter?" but no "How do I fill it?" - IN_APP_MANUAL.md §5a requires both for a form topic.`,
      );
    }

    // §5a: "Every topic must carry at least one example block unless it is purely
    // definitional." `definitional: true` is the deliberate opt-out - never a default -
    // so a topic can't ship without one just because nobody thought of one.
    const hasExample = topic.sections.some((s) => s.blocks.some((b) => b.kind === 'example'));
    if (!hasExample && !topic.definitional) {
      throw new Error(
        `[help] "${topic.id}" has no example block and isn't marked "definitional: true" - IN_APP_MANUAL.md §5a requires one or the other.`,
      );
    }
  }
}
validateSections();

/** Duplicate ids and slug collisions within a category both break routing silently -
 *  worth failing loudly on too, for the same reason as `validateSections`. */
function validateIdentity(): void {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const topic of TOPICS) {
    if (ids.has(topic.id)) throw new Error(`[help] duplicate topic id "${topic.id}".`);
    ids.add(topic.id);
    const slugKey = `${topic.category}/${topic.slug}`;
    if (slugs.has(slugKey)) throw new Error(`[help] duplicate route "/help/${slugKey}".`);
    slugs.add(slugKey);
  }
  const categoryIds = new Set(CATEGORIES.map((c) => c.id));
  for (const topic of TOPICS) {
    if (!categoryIds.has(topic.category)) {
      throw new Error(`[help] "${topic.id}" belongs to category "${topic.category}", which is not in CATEGORIES.`);
    }
  }
}
validateIdentity();

export const byId: Record<DocTopicId, DocTopic> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export function byPath(category: string, slug: string): DocTopic | undefined {
  return TOPICS.find((t) => t.category === category && t.slug === slug);
}

export function topicsByCategory(category: string): DocTopic[] {
  return TOPICS.filter((t) => t.category === category);
}

export function categoryById(id: string): DocCategory | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** The Start Here path (home page, spec §5) - every topic that carries a step, in order. */
export const START_HERE: DocTopic[] = TOPICS.filter((t) => t.startHereStep != null).sort(
  (a, b) => (a.startHereStep ?? 0) - (b.startHereStep ?? 0),
);

/** Every topic in one straight line, category by category in `CATEGORIES`' own order -
 *  "read the manual straight through" (§5a). This is what prev/next walks, wrapping at
 *  both ends, so a topic at a category boundary is never left without a next. */
export const READING_ORDER: DocTopic[] = CATEGORIES.flatMap((c) => topicsByCategory(c.id));

/** Previous/next within `READING_ORDER`, wrapping across category boundaries - "Prev /
 *  next are always present at the foot of a topic" (§5a). */
export function adjacentTopics(topic: DocTopic): { previous: DocTopic; next: DocTopic } {
  const index = READING_ORDER.findIndex((t) => t.id === topic.id);
  const n = READING_ORDER.length;
  const previous = READING_ORDER[(index - 1 + n) % n]!;
  const next = READING_ORDER[(index + 1) % n]!;
  return { previous, next };
}
