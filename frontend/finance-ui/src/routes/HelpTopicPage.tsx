import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { HelpShell } from '@/features/help/components/HelpShell';
import { TopicLink } from '@/features/help/components/TopicLink';
import { TopicView } from '@/features/help/components/TopicView';
import { adjacentTopics, byPath } from '@/features/help/content';

/** `/help/:category/:slug` - one topic in full, plus previous/next, wrapping across
 *  category boundaries so the manual can be read straight through (IN_APP_MANUAL.md
 *  §5a's "buttery navigation"). */
export default function HelpTopicPage() {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const topic = category && slug ? byPath(category, slug) : undefined;

  // Instant scroll to the top of the reading column on topic change - not the document,
  // and not smoothly: a smooth scroll on navigation reads as lag (§5a).
  useEffect(() => {
    document.getElementById('app-main')?.scrollTo(0, 0);
  }, [category, slug]);

  if (!category || !slug) return <Navigate to="/help" replace />;
  if (!topic) {
    return (
      <HelpShell>
        <p className="text-body text-ink-soft">
          That page is not part of the manual (yet). <Link to="/help" className="text-accent underline-offset-2 hover:underline">Back to Help</Link>.
        </p>
      </HelpShell>
    );
  }

  const { previous, next } = adjacentTopics(topic);

  return (
    <HelpShell activeTopic={topic}>
      <TopicView topic={topic} headingLevel="page" />

      <div className="flex items-center justify-between gap-space-4 border-t border-line pt-space-5">
        <TopicLink
          to={`/help/${previous.category}/${previous.slug}`}
          className="flex items-center gap-space-1 text-caption text-ink-soft hover:text-ink"
        >
          <ChevronLeft size={14} strokeWidth={2} aria-hidden />
          {previous.title}
        </TopicLink>
        <TopicLink
          to={`/help/${next.category}/${next.slug}`}
          className="flex items-center gap-space-1 text-caption text-ink-soft hover:text-ink"
        >
          {next.title}
          <ChevronRight size={14} strokeWidth={2} aria-hidden />
        </TopicLink>
      </div>
    </HelpShell>
  );
}
