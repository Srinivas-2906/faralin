'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  apiFetch,
  FARALIN_CONVERSION_DISCLAIMER,
} from '@faralin/utils';
import { PRESTIGE_TIER_LABELS, RANKING_SOURCE, type UniversityPrestigeTier } from '@faralin/types';
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
    prestigeTier?: UniversityPrestigeTier | null;
    guardianRank2025?: number | null;
    rankingSource?: string | null;
    conversionRule: { faralinsPerGbp: number; disclaimerText: string };
    exampleEarnRange?: { min: number; max: number } | null;
    articles: Array<{ id: string; slug: string; title: string; excerpt: string }>;
    events: Array<{ id: string; title: string; startsAt: string }>;
  } | null>(null);
  const [applying, setApplying] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
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

  async function handleRegister(eventId: string) {
    if (!isSignedIn) {
      window.location.href = '/sign-in';
      return;
    }
    setRegisteringId(eventId);
    setError('');
    try {
      const token = await getToken();
      await apiFetch(`/content/events/${eventId}/register`, {
        method: 'POST',
        token: token ?? undefined,
      });
      setRegisteredIds((prev) => new Set(prev).add(eventId));
    } catch {
      setError('Unable to register for this event. Follow the university first, then try again.');
    } finally {
      setRegisteringId(null);
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
  const tierLabel = university.prestigeTier
    ? PRESTIGE_TIER_LABELS[university.prestigeTier]
    : null;

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

        {university.prestigeTier && (
          <section className="uni-economics" aria-labelledby="uni-economics-heading">
            <h2 id="uni-economics-heading" className="uni-economics__heading">
              Partner profile
            </h2>
            <div className="uni-economics__grid">
              <div className="uni-economics__panel">
                <p className="uni-economics__label">University tier</p>
                {tierLabel && (
                  <p
                    className={`uni-economics__value university-card-tier university-card-tier--${university.prestigeTier?.toLowerCase()}`}
                  >
                    {tierLabel}
                    {university.guardianRank2025 ? ` · #${university.guardianRank2025}` : ''}
                  </p>
                )}
                <p className="uni-economics__meta">
                  {university.rankingSource ?? RANKING_SOURCE}
                </p>
              </div>
              <div className="uni-economics__panel">
                <p className="uni-economics__label">Conditional awards</p>
                <p className="uni-economics__value">Dashboard estimates</p>
                <p className="uni-economics__meta">
                  Complete activities to earn Core Faralins, then view this partner&apos;s
                  estimated conditional award on your dashboard.
                </p>
              </div>
            </div>
            <p className="uni-economics__disclaimer">{FARALIN_CONVERSION_DISCLAIMER}</p>
          </section>
        )}

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
                  const registered = registeredIds.has(e.id);
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
                        <Button
                          variant="secondary"
                          loading={registeringId === e.id}
                          disabled={registered}
                          onClick={() => handleRegister(e.id)}
                        >
                          {registered ? 'Registered' : 'Register'}
                        </Button>
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
