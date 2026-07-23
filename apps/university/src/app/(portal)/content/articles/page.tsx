'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  SkeletonTable,
} from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { usePortalContext } from '@/components/portal-provider';
import { useStaffApi } from '@/lib/use-staff-api';
import { studentUniversityUrl } from '@/lib/media';

const ARTICLE_TYPES = ['NEWS', 'BLOG', 'SCHOLARSHIP', 'ADVICE', 'STUDENT_STORY', 'COURSE_GUIDE', 'CHALLENGE_BRIEF'];

interface Article {
  id: string;
  title: string;
  slug: string;
  type: string;
  isPublished: boolean;
  publishedAt: string | null;
}

export default function ArticlesPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const { context } = usePortalContext();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'ADVICE',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    isPublished: false,
  });

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await staffFetch<Article[]>('/content/staff/articles');
      if (data) setArticles(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [staffFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await staffFetch('/content/staff/articles', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ type: 'ADVICE', title: '', slug: '', excerpt: '', content: '', isPublished: false });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create article');
    }
  }

  async function togglePublish(article: Article) {
    try {
      await staffFetch(`/content/staff/articles/${article.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: !article.isPublished }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update article');
    }
  }

  if (accessDenied) return <AccessDenied />;
  if (loading) {
    return (
      <div className="page-section">
        <div className="container">
          <PageHeader
            title="Articles"
            description="Publish content for students following your university."
          />
          <Card>
            <SkeletonTable rows={4} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Articles"
          description="Publish content for students following your university."
          actions={
            <div className="portal-page-actions">
              {context?.university.slug ? (
                <a
                  href={studentUniversityUrl(context.university.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  View live page
                </a>
              ) : null}
              <Button type="button" variant="secondary" onClick={() => load()}>
                Refresh
              </Button>
              <Button type="button" onClick={() => setShowForm((v) => !v)}>
                {showForm ? 'Cancel' : 'New article'}
              </Button>
            </div>
          }
        />

        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {showForm && (
          <Card style={{ marginBottom: 'var(--section-gap)' }}>
            <form className="form-stack" onSubmit={handleCreate}>
              <div className="form-row">
                <label htmlFor="article-type">Type</label>
                <select
                  id="article-type"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {ARTICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="article-title">Title</label>
                <input
                  id="article-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <label htmlFor="article-slug">Slug</label>
                <input
                  id="article-slug"
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <label htmlFor="article-excerpt">Excerpt</label>
                <input
                  id="article-excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <label htmlFor="article-content">Content</label>
                <textarea
                  id="article-content"
                  required
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                />
                Publish immediately
              </label>
              <Button type="submit">Create article</Button>
            </form>
          </Card>
        )}

        <Card>
          {articles.length === 0 ? (
            <EmptyState
              compact
              message="No articles yet. Publish to appear on faralin.kaana.in/universities/…"
            />
          ) : (
            <ResponsiveTable<Article>
              columns={[
                { key: 'title', header: 'Title', render: (a) => a.title },
                { key: 'type', header: 'Type', render: (a) => a.type },
                {
                  key: 'published',
                  header: 'Published',
                  render: (a) => (a.isPublished ? 'Yes' : 'No'),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (a) => (
                    <Button type="button" variant="secondary" onClick={() => togglePublish(a)}>
                      {a.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                  ),
                },
              ]}
              data={articles}
              getRowKey={(a) => a.id}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
