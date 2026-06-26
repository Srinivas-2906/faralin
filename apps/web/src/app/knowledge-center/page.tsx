import Link from 'next/link';
import { HomeWideBanner } from '@/components/home-wide-banner';
import { AllNewtonsFeature } from '@/components/knowledge-center/all-newtons-feature';
import { KnowledgeHubPreview } from '@/components/knowledge-center/knowledge-hub-preview';
import { getAuthPanelImage } from '@/lib/media';
import { getCourses, getKnowledgeArticles } from '@/lib/knowledge';

export default async function KnowledgeCenterPage() {
  const [blogs, news, courses] = await Promise.all([
    getKnowledgeArticles('blog'),
    getKnowledgeArticles('news'),
    getCourses(),
  ]);

  return (
    <div className="knowledge-center-page">
      <HomeWideBanner
        imageSrc={getAuthPanelImage()}
        imageAlt="Student reading in a library"
        eyebrow="Knowledge Center"
        title="Learn, explore, and stay ahead."
      />

      <div className="page-section knowledge-center-page-body">
        <div className="container-wide">
          <p className="knowledge-center-intro">
            Blogs, partner news, video courses, and study resources — your reference library for
            Faralin and university applications.
          </p>

          <KnowledgeHubPreview
            blogs={blogs.slice(0, 2)}
            news={news.slice(0, 2)}
            courses={courses.slice(0, 3)}
          />

          <div className="knowledge-hub-resources-callout">
            <AllNewtonsFeature compact />
          </div>

          <div className="knowledge-hub-quick-links">
            <Link href="/knowledge-center/blogs" className="knowledge-hub-quick-link">
              Blogs
            </Link>
            <Link href="/knowledge-center/news" className="knowledge-hub-quick-link">
              News
            </Link>
            <Link href="/knowledge-center/courses" className="knowledge-hub-quick-link">
              Courses
            </Link>
            <Link href="/knowledge-center/resources" className="knowledge-hub-quick-link">
              Resources
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
