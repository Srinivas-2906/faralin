import Link from 'next/link';
import { MediaCard, PromoCard } from '@faralin/ui';
import { HomeHeroNav } from '@/components/home-hero-nav';
import { HomeSearch } from '@/components/home-search';
import { HomeCtaDuo } from '@/components/home-cta-duo';
import { HomeProcessBand } from '@/components/home-process-band';
import { HomeWhySection } from '@/components/home-why-section';
import { HomeWideBanner } from '@/components/home-wide-banner';
import { getHomeSpotlightUniversityImage, getPortfolioBandImage, getSubjectImage, getUniversitiesBannerImage } from '@/lib/media';

const universitySpotlight = [
  { slug: 'oxford', name: 'Oxford' },
  { slug: 'manchester', name: 'Manchester' },
  { slug: 'bristol', name: 'Bristol' },
  { slug: 'southampton', name: 'Southampton' },
  { slug: 'exeter', name: 'Exeter' },
];

export default function HomePage() {
  return (
    <div className="home-shell">
      <section className="home-hero">
        <div className="container-wide home-hero-split">
          <div className="home-hero-copy">
            <p className="home-hero-eyebrow">University-backed recognition</p>
            <h1 className="home-hero-title">
              <span className="home-hero-title-line">Academic Excellence,</span>
              <span className="home-hero-title-line home-hero-title-accent">Recognized.</span>
            </h1>
            <p className="home-hero-lead">
              Take verified assessments and build a recognition record with partner universities.
            </p>
            <HomeSearch />
          </div>
          <HomeHeroNav />
        </div>
      </section>

      <HomeProcessBand />

      <HomeWhySection />

      <HomeWideBanner
        imageSrc={getUniversitiesBannerImage()}
        imageAlt="University great hall with vaulted ceiling and reading tables"
        eyebrow="Explore"
        title="Find your partner university"
        href="/universities"
        ctaLabel="Browse universities"
      />

      <section className="home-section">
        <div className="container-wide">
          <header className="home-section-head">
            <div className="home-section-head-inner">
              <p className="home-section-eyebrow">Start earning</p>
              <h2 className="home-section-title">Your path to recognition</h2>
            </div>
          </header>
          <div className="home-mosaic">
            <PromoCard
              href="/assessments"
              variant="ink"
              title="Take an assessment"
              subtitle="Verified subject work — earn Faralins with no gimmicks."
            />
            <MediaCard
              aspect="16x9"
              href="/dashboard"
              overlay
              photoStyle="hero"
              imageSrc={getPortfolioBandImage()}
              imageAlt=""
              eyebrow="Your record"
              title="View your dashboard"
              meta="Track recognition across every university you select."
            />
            <PromoCard
              href="/dashboard"
              variant="crimson"
              title="See your dashboard"
              subtitle="Progress, milestones, and estimated conditional bursary value."
            />
          </div>
        </div>
      </section>

      <HomeWideBanner
        imageSrc={getSubjectImage('computer-science')}
        imageAlt="Student studying"
        eyebrow="Assessments"
        title="Prove what you know. Earn what you deserve."
        href="/assessments"
        ctaLabel="View assessments"
      />

      <section className="home-section">
        <div className="container-wide">
          <header className="home-section-head home-section-head--row">
            <div className="home-section-head-inner">
              <p className="home-section-eyebrow">Partners</p>
              <h2 className="home-section-title">Universities on Faralin</h2>
            </div>
            <Link href="/universities" className="home-section-link">
              View all →
            </Link>
          </header>
          <div className="home-spotlight-grid">
            {universitySpotlight.map((uni) => (
              <MediaCard
                key={uni.slug}
                href={`/universities/${uni.slug}`}
                aspect="16x9"
                overlay
                photoStyle="hero"
                imageSrc={getHomeSpotlightUniversityImage(uni.slug)}
                imageAlt={uni.name}
                eyebrow="Partners"
                title={uni.name}
                meta="Partner university"
                ribbon
              />
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section--immersive">
        <div className="container-wide">
          <HomeCtaDuo />
        </div>
      </section>
    </div>
  );
}
