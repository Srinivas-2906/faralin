'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@faralin/utils';
import { Alert, Button, ImageBanner, MediaCard } from '@faralin/ui';
import { getUniversityImage } from '@/lib/media';

export default function UniversityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getToken, isSignedIn } = useAuth();
  const [university, setUniversity] = useState<{
    name: string;
    slug: string;
    logoUrl?: string | null;
    description: string;
    websiteUrl: string;
    conversionRule: { faralinsPerGbp: number; disclaimerText: string };
    articles: Array<{ id: string; slug: string; title: string; excerpt: string }>;
    events: Array<{ id: string; title: string; startsAt: string }>;
  } | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/universities/${slug}`)
      .then((r) => r.json())
      .then(setUniversity)
      .catch(() => setError('Failed to load university'));
  }, [slug]);

  async function handleApply() {
    if (!isSignedIn) {
      window.location.href = '/sign-in';
      return;
    }
    setApplying(true);
    setError('');
    try {
      const token = await getToken();
      const result = await apiFetch<{ redirectUrl: string }>(`/applications/${slug}/referral`, {
        method: 'POST',
        token: token ?? undefined,
      });
      if (result.redirectUrl) {
        window.open(result.redirectUrl, '_blank');
      }
    } catch {
      setError('Unable to track application referral. Please try again.');
    } finally {
      setApplying(false);
    }
  }

  if (!university) {
    return (
      <div className="page-section">
        <div className="container-wide">
          {error ? <Alert>{error}</Alert> : <p className="text-muted">Loading…</p>}
        </div>
      </div>
    );
  }

  const cover = getUniversityImage(university.slug ?? slug, university.logoUrl);

  return (
    <div className="page-section">
      <div className="container-wide">
        <ImageBanner
          imageSrc={cover}
          imageAlt={university.name}
          title={university.name}
          subtitle={university.description?.slice(0, 120)}
        />

        {error && <Alert>{error}</Alert>}

        <div className="uni-toolbar">
          {university.conversionRule && (
            <div className="uni-toolbar__stat">
              <p className="uni-toolbar__stat-value">
                {university.conversionRule.faralinsPerGbp} Faralins ≈ £1
              </p>
              <p className="uni-toolbar__stat-label">Conversion rate</p>
            </div>
          )}
          <div className="uni-toolbar__actions">
            <Button loading={applying} onClick={handleApply}>
              {applying ? 'Opening…' : 'Apply on university website'}
            </Button>
            {university.websiteUrl && (
              <a
                href={university.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                Visit website
              </a>
            )}
          </div>
        </div>

        <div className="uni-feed">
          <section className="uni-feed__col">
            <h2 className="uni-feed__heading">News</h2>
            {university.articles.length === 0 ? (
              <p className="text-muted uni-feed__empty">No articles yet.</p>
            ) : (
              <ul className="uni-feed__list">
                {university.articles.map((a) => (
                  <li key={a.id} className="uni-feed__item">
                    <Link
                      href={`/knowledge-center/articles/${a.slug}`}
                      className="uni-feed__link"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <MediaCard
                        imageSrc={cover}
                        imageAlt=""
                        title={a.title}
                        meta={a.excerpt?.slice(0, 90)}
                        horizontal
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="uni-feed__col">
            <h2 className="uni-feed__heading">Events</h2>
            {university.events.length === 0 ? (
              <p className="text-muted uni-feed__empty">No upcoming events.</p>
            ) : (
              <ul className="uni-feed__list">
                {university.events.map((e) => {
                  const date = new Date(e.startsAt);
                  return (
                    <li key={e.id} className="uni-feed__item uni-feed__item--event">
                      <div className="uni-feed__event-date">
                        <span className="uni-feed__event-weekday">
                          {date.toLocaleDateString('en-GB', { weekday: 'short' })}
                        </span>
                        <span className="uni-feed__event-day">
                          {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="uni-feed__event-copy">
                        <p className="uni-feed__event-title">{e.title}</p>
                        <p className="uni-feed__event-meta">
                          {date.toLocaleDateString('en-GB', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {university.conversionRule && (
          <p className="disclaimer">{university.conversionRule.disclaimerText}</p>
        )}
      </div>
    </div>
  );
}
