import { Suspense } from 'react';
import { HomeWideBanner } from '@/components/home-wide-banner';
import { ArticlesCatalog } from '@/components/knowledge-center/articles-catalog';
import { BlogsCatalogInsight } from '@/components/knowledge-center/knowledge-insights';
import { getAuthPanelImage } from '@/lib/media';
import { getKnowledgeArticles } from '@/lib/knowledge';

export default async function BlogsPage() {
  const articles = await getKnowledgeArticles('blog');

  return (
    <div className="knowledge-center-page">
      <HomeWideBanner
        imageSrc={getAuthPanelImage()}
        imageAlt=""
        eyebrow="Blogs"
        title="Guides and explainers for your journey."
      />

      <div className="page-section knowledge-center-page-body">
        <div className="container-wide">
          <div className="assessments-stats-row">
            <BlogsCatalogInsight />
          </div>
          <Suspense fallback={null}>
            <ArticlesCatalog articles={articles} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
