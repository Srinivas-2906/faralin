import { Suspense } from 'react';
import { HomeWideBanner } from '@/components/home-wide-banner';
import { ArticlesCatalog } from '@/components/knowledge-center/articles-catalog';
import { NewsCatalogInsight } from '@/components/knowledge-center/knowledge-insights';
import { getAuthPanelImage } from '@/lib/media';
import { getKnowledgeArticles } from '@/lib/knowledge';

export default async function NewsPage() {
  const articles = await getKnowledgeArticles('news');

  return (
    <div className="knowledge-center-page">
      <HomeWideBanner
        imageSrc={getAuthPanelImage()}
        imageAlt=""
        eyebrow="News"
        title="Updates from partner universities."
      />

      <div className="page-section knowledge-center-page-body">
        <div className="container-wide">
          <div className="assessments-stats-row">
            <NewsCatalogInsight />
          </div>
          <Suspense fallback={null}>
            <ArticlesCatalog articles={articles} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
