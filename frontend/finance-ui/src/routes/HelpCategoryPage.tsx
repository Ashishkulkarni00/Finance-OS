import { Link, Navigate, useParams } from 'react-router-dom';
import { HelpShell } from '@/features/help/components/HelpShell';
import { TopicLink } from '@/features/help/components/TopicLink';
import { categoryById, topicsByCategory } from '@/features/help/content';

/** `/help/:category` - the category index: title, summary, and every topic in it. */
export default function HelpCategoryPage() {
  const { category: categoryId } = useParams<{ category: string }>();
  const category = categoryId ? categoryById(categoryId) : undefined;

  if (!categoryId) return <Navigate to="/help" replace />;
  if (!category) {
    return (
      <HelpShell>
        <p className="text-body text-ink-soft">
          That category is not part of the manual (yet). <Link to="/help" className="text-accent underline-offset-2 hover:underline">Back to Help</Link>.
        </p>
      </HelpShell>
    );
  }

  const topics = topicsByCategory(category.id);

  return (
    <HelpShell>
      <div className="flex flex-col gap-space-6">
        <div className="flex flex-col gap-space-2">
          <h1 className="font-serif text-editorial text-ink">{category.title}</h1>
          <p className="max-w-[68ch] text-body text-ink-soft">{category.summary}</p>
        </div>

        <div className="flex flex-col">
          {topics.map((topic) => (
            <TopicLink
              key={topic.id}
              to={`/help/${category.id}/${topic.slug}`}
              className="flex flex-col gap-space-1 border-b border-line py-space-4 transition-colors duration-150 first:pt-0 last:border-b-0 hover:opacity-80"
            >
              <span className="text-label font-medium text-ink">{topic.title}</span>
              <span className="text-caption text-ink-muted">{topic.summary}</span>
            </TopicLink>
          ))}
        </div>
      </div>
    </HelpShell>
  );
}
