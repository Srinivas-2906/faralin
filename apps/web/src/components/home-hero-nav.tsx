'use client';

import Link from 'next/link';

function AssessmentsCard() {
  return (
    <Link href="/assessments" className="hero-tile hero-tile--photo">
      <span
        className="hero-tile__photo"
        style={{ backgroundImage: "url('/images/subjects/mathematics.jpg')" }}
        aria-hidden="true"
      />
      <span className="hero-tile__photo-scrim" aria-hidden="true" />
      <span className="hero-tile__photo-accent" aria-hidden="true" />
      <span className="hero-tile__photo-copy">
        <span className="hero-tile__eyebrow">Subject work</span>
        <span className="hero-tile__label">Assessments</span>
        <span className="hero-tile__hint">100+ verified assessments</span>
      </span>
    </Link>
  );
}

function UniversitiesCard() {
  return (
    <Link href="/universities" className="hero-tile hero-tile--photo">
      <span
        className="hero-tile__photo"
        style={{ backgroundImage: "url('/images/universities/oxford.jpg')" }}
        aria-hidden="true"
      />
      <span className="hero-tile__photo-scrim" aria-hidden="true" />
      <span className="hero-tile__photo-accent" aria-hidden="true" />
      <span className="hero-tile__photo-copy">
        <span className="hero-tile__eyebrow">Partners</span>
        <span className="hero-tile__label">Universities</span>
        <span className="hero-tile__hint">12+ on Faralin</span>
      </span>
    </Link>
  );
}

function DashboardCard() {
  return (
    <Link href="/dashboard" className="hero-tile hero-tile--dashboard">
      <span className="hero-tile__dashboard-main">
        <span className="hero-tile__metrics-head">
          <span>
            <span className="hero-tile__metrics-eyebrow">Your progress</span>
            <span className="hero-tile__label hero-tile__label--dark">Dashboard</span>
          </span>
          <span className="hero-tile__metrics-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </span>
        </span>
        <span className="hero-tile__metrics-row">
          <span className="hero-tile__metric">
            <span className="hero-tile__metric-value">2.4k</span>
            <span className="hero-tile__metric-label">Faralins</span>
          </span>
          <span className="hero-tile__metric">
            <span className="hero-tile__metric-value">8</span>
            <span className="hero-tile__metric-label">Done</span>
          </span>
          <span className="hero-tile__metric hero-tile__metric--gold">
            <span className="hero-tile__metric-value">£420</span>
            <span className="hero-tile__metric-label">Est.</span>
          </span>
        </span>
        <span className="hero-tile__metrics-bar" aria-hidden="true">
          <span className="hero-tile__metrics-bar-fill" />
        </span>
        <span className="hero-tile__dashboard-link">View recognition →</span>
      </span>
      <span
        className="hero-tile__dashboard-thumb"
        style={{ backgroundImage: "url('/images/portfolio-band.jpg')" }}
        aria-hidden="true"
      />
    </Link>
  );
}

export function HomeHeroNav() {
  return (
    <nav className="home-hero-nav" aria-label="Explore Faralin">
      <ul className="home-hero-nav-grid">
        <li className="home-hero-nav-item home-hero-nav-item--assessments">
          <AssessmentsCard />
        </li>
        <li className="home-hero-nav-item home-hero-nav-item--universities">
          <UniversitiesCard />
        </li>
        <li className="home-hero-nav-item home-hero-nav-item--dashboard">
          <DashboardCard />
        </li>
      </ul>
    </nav>
  );
}
