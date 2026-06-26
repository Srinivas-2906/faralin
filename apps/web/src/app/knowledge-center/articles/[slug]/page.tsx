import { notFound } from 'next/navigation';
import { Badge } from '@faralin/ui';
import { ARTICLE_TYPE_LABELS } from '@faralin/types';
import { MediaImage } from '@faralin/ui';
import { getArticleCoverImage } from '@/lib/media';
import { getKnowledgeArticle } from '@/lib/knowledge';

function renderContent(content: string) {
  return content.split('\n\n').map((paragraph, index) => {
    const html = paragraph.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return (
      <p
        key={index}
        className="knowledge-article-paragraph"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  });
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getKnowledgeArticle(slug);
  if (!article) notFound();

  const typeLabel =
    ARTICLE_TYPE_LABELS[article.type as keyof typeof ARTICLE_TYPE_LABELS] ?? article.type;

  return (
    <div className="page-section knowledge-article-page">
      <article className="container-narrow">
        <div className="knowledge-article-header">
          <Badge variant="copper">{typeLabel}</Badge>
          <p className="knowledge-article-meta">
            {article.university.shortName ?? article.university.name}
            {article.publishedAt
              ? ` · ${new Date(article.publishedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}`
              : ''}
          </p>
          <h1 className="knowledge-article-title">{article.title}</h1>
          {article.excerpt && <p className="knowledge-article-excerpt">{article.excerpt}</p>}
        </div>

        <div className="knowledge-article-cover">
          <MediaImage
            src={getArticleCoverImage(article.university.slug)}
            alt=""
            aspect="16x9"
            frameClassName="media-frame--fill"
          />
        </div>

        <div className="knowledge-article-body">{renderContent(article.content)}</div>
      </article>
    </div>
  );
}
