import { Badge, MediaImage } from '@faralin/ui';
import { ARTICLE_TYPE_LABELS } from '@faralin/types';
import { getArticleCoverImage } from '@/lib/media';
import type { KnowledgeArticleListItem } from '@/lib/knowledge';

export function ArticleCard({ article }: { article: KnowledgeArticleListItem }) {
  const typeLabel =
    ARTICLE_TYPE_LABELS[article.type as keyof typeof ARTICLE_TYPE_LABELS] ?? article.type;

  return (
    <a
      href={`/knowledge-center/articles/${article.slug}`}
      className="media-card assessment-card-split"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="assessment-card-visual">
        <MediaImage
          src={getArticleCoverImage(article.university.slug)}
          alt=""
          aspect="16x9"
          frameClassName="media-frame--fill"
        />
        <div className="assessment-card-badges-overlay" aria-hidden="true" />
        <div className="assessment-card-badges">
          <Badge variant="copper">{typeLabel}</Badge>
        </div>
      </div>
      <div className="assessment-card-details">
        <div className="media-card-eyebrow">
          {article.university.shortName ?? article.university.name}
        </div>
        <div className="media-card-title">{article.title}</div>
        <div className="media-card-meta">
          {article.excerpt?.slice(0, 90) ?? 'Read more'}
        </div>
      </div>
    </a>
  );
}
