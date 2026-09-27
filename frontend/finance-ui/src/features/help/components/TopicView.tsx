import { TopicLink } from './TopicLink';
import { DocBlockRenderer } from './DocBlockRenderer';
import { byId } from '../content';
import type { DocTopic } from '../types';

/**
 * The section headings a topic actually renders, in order - used for the right rail's
 * "On this page" (§5's Layout table). This now falls straight out of the data
 * (`topic.sections`) instead of being re-derived from block kinds - IN_APP_MANUAL.md §5a
 * "Standardised structure - explicit, not inferred" replaced the positional heuristic
 * this function used to be.
 */
export function sectionHeadingsFor(topic: DocTopic): string[] {
  const headings = topic.sections.map((s) => s.heading);
  if (topic.related.length > 0 && headings[headings.length - 1] !== 'Related') headings.push('Related');
  return headings;
}

function SectionHeading({ children }: { children: string }) {
  // Ruled small caps, IN_APP_MANUAL.md §5a: "the same SectionHeader language the app
  // already speaks" - a hairline above, not a filled box, so a section is set off by
  // space and a rule rather than a card.
  return (
    <div className="border-t border-line pt-space-4">
      <h3 className="text-micro font-medium uppercase tracking-[0.08em] text-ink-muted">{children}</h3>
    </div>
  );
}

/**
 * Renders one topic in full - every section, in order, for someone reading to learn
 * (§1's "manual" surface). The same component is used inside `HelpOverlay` (the
 * contextual surface) and on `/help/:category/:slug` (the browsing surface), so the two
 * can never show different content for the same topic.
 */
export function TopicView({
  topic,
  headingLevel = 'section',
}: {
  topic: DocTopic;
  /** `none` for a surface that already names the topic in its own chrome - the overlay
   *  puts the title in its header bar, and repeating it as an H2 directly underneath
   *  reads as a mistake. The summary still shows: it is the one-line version, not a
   *  restatement of the title. */
  headingLevel?: 'page' | 'section' | 'none';
}) {
  return (
    <div className="flex max-w-[68ch] flex-col gap-space-6">
      <div className="flex flex-col gap-space-2">
        {headingLevel === 'page' && <h1 className="font-serif text-editorial text-ink">{topic.title}</h1>}
        {headingLevel === 'section' && <h2 className="text-title text-ink">{topic.title}</h2>}
        <p className="text-body text-ink-soft">{topic.summary}</p>
      </div>

      {topic.sections.map((section, i) => (
        <div key={i} className="flex flex-col gap-space-3">
          <SectionHeading>{section.heading}</SectionHeading>
          <div className="flex flex-col gap-space-4">
            {section.blocks.map((block, j) => (
              <DocBlockRenderer key={j} block={block} />
            ))}
          </div>
        </div>
      ))}

      {topic.related.length > 0 && (
        <div className="flex flex-col gap-space-3">
          {topic.sections[topic.sections.length - 1]?.heading !== 'Related' && <SectionHeading>Related</SectionHeading>}
          <div className="flex flex-wrap gap-x-space-5 gap-y-space-2">
            {topic.related.map((relatedId) => {
              const related = byId[relatedId];
              if (!related) return null;
              return (
                <TopicLink
                  key={relatedId}
                  to={`/help/${related.category}/${related.slug}`}
                  className="text-caption text-accent underline-offset-2 hover:underline"
                >
                  {related.title}
                </TopicLink>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
