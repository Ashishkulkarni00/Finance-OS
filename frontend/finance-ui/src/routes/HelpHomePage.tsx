import { ArrowRight } from 'lucide-react';
import { HelpShell } from '@/features/help/components/HelpShell';
import { SearchBox } from '@/features/help/components/SearchBox';
import { TopicLink } from '@/features/help/components/TopicLink';
import { CATEGORIES, START_HERE, topicsByCategory } from '@/features/help/content';

/** The six most-asked questions - the first `qa` item found on each of the six Phase A
 *  categories' topics, in category order. Read from the same content the rest of the
 *  manual renders, so this can never list a question the content itself does not have. */
function topAskedQuestions(): { question: string; answer: string; to: string }[] {
  const picked: { question: string; answer: string; to: string }[] = [];
  for (const category of CATEGORIES) {
    for (const topic of topicsByCategory(category.id)) {
      const qa = topic.sections.flatMap((s) => s.blocks).find((b) => b.kind === 'qa');
      if (qa && qa.kind === 'qa' && qa.items[0]) {
        picked.push({ ...qa.items[0], to: `/help/${topic.category}/${topic.slug}` });
        break;
      }
    }
    if (picked.length >= 6) break;
  }
  return picked.slice(0, 6);
}

/**
 * `/help` - IN_APP_MANUAL.md §5's Home: a welcome line, what Kosh does in three
 * sentences, the Start Here path, search, the category grid, and the most-asked
 * questions.
 */
export default function HelpHomePage() {
  const questions = topAskedQuestions();

  return (
    <HelpShell searchInSidebar={false}>
      <div className="flex flex-col gap-space-8">
        <div className="flex flex-col gap-space-3">
          <p className="font-serif text-editorial text-ink">Welcome to the Kosh manual.</p>
          <p className="max-w-[68ch] text-body text-ink-soft">
            Kosh keeps one running number: what you can actually spend, once every bill still due and everything you have
            set aside is already accounted for. It plans a month at a time, from one salary to the next rather than the
            1st to the 31st. And it never guesses - where a figure is not known, it says so rather than showing you a
            number it cannot stand behind.
          </p>
        </div>

        <div className="max-w-md">
          <SearchBox />
        </div>

        <section>
          <p className="mb-space-4 text-micro uppercase tracking-[0.08em] text-ink">Start here</p>
          <ol className="flex flex-col gap-space-3">
            {START_HERE.map((topic, i) => (
              <li key={topic.id}>
                <TopicLink
                  to={`/help/${topic.category}/${topic.slug}`}
                  className="group flex items-start gap-space-3 rounded-lg border border-line px-space-4 py-space-3 transition-colors duration-150 hover:border-accent hover:bg-accent-wash"
                >
                  <span className="num mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-caption font-medium text-ink-soft group-hover:bg-accent group-hover:text-white">
                    {i + 1}
                  </span>
                  <span className="flex flex-col gap-space-1 pt-px">
                    <span className="text-label font-medium text-ink">{topic.title}</span>
                    <span className="text-caption text-ink-muted">{topic.summary}</span>
                  </span>
                </TopicLink>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <p className="mb-space-4 text-micro uppercase tracking-[0.08em] text-ink">Browse by topic</p>
          <div className="grid grid-cols-1 gap-space-4 sm:grid-cols-2">
            {CATEGORIES.map((category) => {
              const count = topicsByCategory(category.id).length;
              return (
                <TopicLink
                  key={category.id}
                  to={`/help/${category.id}`}
                  className="flex flex-col gap-space-2 rounded-lg border border-line px-space-4 py-space-4 transition-colors duration-150 hover:border-accent hover:bg-accent-wash"
                >
                  <span className="flex items-center justify-between gap-space-2">
                    <span className="text-label font-medium text-ink">{category.title}</span>
                    <span className="text-caption text-ink-muted">
                      {count} {count === 1 ? 'topic' : 'topics'}
                    </span>
                  </span>
                  <span className="text-caption text-ink-muted">{category.summary}</span>
                </TopicLink>
              );
            })}
          </div>
        </section>

        {questions.length > 0 && (
          <section>
            <p className="mb-space-4 text-micro uppercase tracking-[0.08em] text-ink">Most asked</p>
            <div className="rounded-lg border border-line">
              {questions.map((q) => (
                <TopicLink
                  key={q.question}
                  to={q.to}
                  className="flex items-start justify-between gap-space-3 border-b border-line px-space-4 py-space-3 text-left transition-colors duration-150 last:border-b-0 hover:bg-sunken"
                >
                  <span className="flex flex-col gap-space-1">
                    <span className="text-label text-ink">{q.question}</span>
                    <span className="text-caption text-ink-muted">{q.answer}</span>
                  </span>
                  <ArrowRight size={14} strokeWidth={2} className="mt-space-1 shrink-0 text-ink-muted" aria-hidden />
                </TopicLink>
              ))}
            </div>
          </section>
        )}
      </div>
    </HelpShell>
  );
}
