import Link from 'next/link';
import { MediaImage } from '@faralin/ui';
import { getArticleCoverImage } from '@/lib/media';

export interface DashboardUpdateArticle {
  id: string;
  slug?: string;
  title: string;
  excerpt: string;
  university: { shortName: string; slug?: string };
}

export function DashboardUpdateItem({ article }: { article: DashboardUpdateArticle }) {
  return (
    <article className="dashboard-bento-item">
      <div className="dashboard-bento-item-media">
        <MediaImage
          src={getArticleCoverImage(article.university.slug ?? 'oxford')}
          alt=""
          aspect="4x3"
        />
      </div>
      <div className="dashboard-bento-item-body">
        <div className="dashboard-bento-item-top">
          <p className="dashboard-bento-item-title">{article.title}</p>
          <Link
            href={
              article.slug
                ? `/knowledge-center/articles/${article.slug}`
                : '/knowledge-center'
            }
            className="dashboard-bento-item-link"
          >
            Read →
          </Link>
        </div>
        <p className="dashboard-bento-item-meta">
          <span className="dashboard-bento-item-meta-primary">{article.university.shortName}</span>
        </p>
      </div>
    </article>
  );
}
