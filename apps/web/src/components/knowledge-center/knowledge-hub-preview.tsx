import Link from 'next/link';
import { MediaImage } from '@faralin/ui';
import { getArticleCoverImage } from '@/lib/media';
import type { KnowledgeArticleListItem, CourseListItem } from '@/lib/knowledge';
import { formatDurationMinutes } from '@/lib/knowledge';
import { getSubjectImage } from '@/lib/media';

export function KnowledgeHubPreview({
  blogs,
  news,
  courses,
}: {
  blogs: KnowledgeArticleListItem[];
  news: KnowledgeArticleListItem[];
  courses: CourseListItem[];
}) {
  return (
    <div className="knowledge-hub-grid">
      <HubSection title="Latest blogs" href="/knowledge-center/blogs" linkLabel="All blogs →">
        {blogs.map((article) => (
          <HubArticleRow key={article.id} article={article} />
        ))}
        {blogs.length === 0 && <p className="knowledge-hub-empty">No blog posts yet.</p>}
      </HubSection>

      <HubSection title="Partner news" href="/knowledge-center/news" linkLabel="All news →">
        {news.map((article) => (
          <HubArticleRow key={article.id} article={article} />
        ))}
        {news.length === 0 && <p className="knowledge-hub-empty">No news yet.</p>}
      </HubSection>

      <HubSection title="Video courses" href="/knowledge-center/courses" linkLabel="All courses →">
        {courses.map((course) => (
          <Link
            key={course.slug}
            href={`/knowledge-center/courses/${course.slug}`}
            className="knowledge-hub-course-row"
          >
            <div className="knowledge-hub-course-thumb">
              <MediaImage
                src={course.thumbnailUrl ?? getSubjectImage(course.subjectTags[0] ?? 'mathematics')}
                alt=""
                aspect="16x9"
                frameClassName="media-frame--fill"
              />
            </div>
            <div>
              <p className="knowledge-hub-course-title">{course.title}</p>
              <p className="knowledge-hub-course-meta">
                {course.instructorName} · {formatDurationMinutes(course.durationMinutes)}
              </p>
            </div>
          </Link>
        ))}
        {courses.length === 0 && <p className="knowledge-hub-empty">No courses yet.</p>}
      </HubSection>
    </div>
  );
}

function HubSection({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="knowledge-hub-panel">
      <div className="knowledge-hub-panel-head">
        <h2 className="knowledge-hub-panel-title">{title}</h2>
        <Link href={href} className="dashboard-section-link">
          {linkLabel}
        </Link>
      </div>
      <div className="knowledge-hub-panel-body">{children}</div>
    </section>
  );
}

function HubArticleRow({ article }: { article: KnowledgeArticleListItem }) {
  return (
    <Link
      href={`/knowledge-center/articles/${article.slug}`}
      className="knowledge-hub-article-row"
    >
      <div className="knowledge-hub-article-thumb">
        <MediaImage
          src={getArticleCoverImage(article.university.slug)}
          alt=""
          aspect="4x3"
        />
      </div>
      <div>
        <p className="knowledge-hub-article-title">{article.title}</p>
        <p className="knowledge-hub-article-meta">
          {article.university.shortName ?? article.university.name}
        </p>
      </div>
    </Link>
  );
}
