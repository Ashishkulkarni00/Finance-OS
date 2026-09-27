import { TOPICS } from './content';
import type { DocBlock, DocTopic } from './types';

export interface SearchResult {
  id: string;
  category: string;
  slug: string;
  title: string;
  summary: string;
}

/** Every scrap of text a block carries, flattened for the haystack. */
function blockText(block: DocBlock): string {
  switch (block.kind) {
    case 'prose':
      return block.text;
    case 'steps':
      return block.items.join(' ');
    case 'fields':
      return [block.intro ?? '', ...block.items.map((f) => `${f.label} ${f.what} ${f.example ?? ''} ${f.whereToFind ?? ''}`)].join(' ');
    case 'qa':
      return block.items.map((i) => `${i.question} ${i.answer}`).join(' ');
    case 'terms':
      return block.items.map((i) => `${i.term} ${i.means}`).join(' ');
    case 'example':
      return [block.title, ...block.lines.map((l) => `${l.label} ${l.value}`), block.note ?? ''].join(' ');
    case 'callout':
      return block.text;
    case 'table':
      return [...block.head, ...block.rows.flat()].join(' ');
    case 'elsewhere':
      return block.items.map((i) => `${i.thing} ${i.where}`).join(' ');
    default:
      return '';
  }
}

interface IndexedTopic {
  topic: DocTopic;
  haystack: string;
}

/** Built once at module load - ~50 topics makes this instant, and the content is the
 *  only source it reads, so it can never disagree with what the manual actually shows
 *  (DESIGN spec §5). */
const INDEX: IndexedTopic[] = TOPICS.map((topic) => ({
  topic,
  haystack: [topic.title, topic.summary, ...topic.sections.flatMap((s) => s.blocks).map(blockText)].join(' — ').toLowerCase(),
}));

/**
 * Client-side search, no dependency. Score: a title match outranks a summary match,
 * which outranks a body match; results are capped at 8.
 */
export function search(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = INDEX.map(({ topic, haystack }) => {
    let score = 0;
    if (topic.title.toLowerCase().includes(q)) score += 4;
    if (topic.summary.toLowerCase().includes(q)) score += 2;
    if (haystack.includes(q)) score += 1;
    return { topic, score };
  }).filter((r) => r.score > 0);

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 8).map(({ topic }) => ({
    id: topic.id,
    category: topic.category,
    slug: topic.slug,
    title: topic.title,
    summary: topic.summary,
  }));
}
