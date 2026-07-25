'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Skeleton } from '@faralin/ui';
import { usePortalContext } from '@/components/portal-provider';
import { getUniversityLogoUrl } from '@/lib/media';
import { useStaffApi } from '@/lib/use-staff-api';

const navSections = [
  {
    title: 'Overview',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: '◉' },
      { href: '/students', label: 'Students', icon: '◎' },
      { href: '/applications', label: 'Applications', icon: '◈', countKey: 'applications' as const },
    ],
  },
  {
    title: 'Assessments',
    links: [
      { href: '/assessments/library', label: 'Library', icon: '▦' },
      { href: '/assessments/active', label: 'Active', icon: '▣' },
    ],
  },
  {
    title: 'Tracks',
    links: [
      { href: '/tracks', label: 'Problem Trackers', icon: '↝' },
      { href: '/tracks/journeys', label: 'Journeys', icon: '↬' },
    ],
  },
  {
    title: 'Rewards',
    links: [
      { href: '/rewards', label: 'Rewards', icon: '◆' },
      { href: '/recognition', label: 'Recognition Tiers', icon: '★' },
      { href: '/leaderboard', label: 'Leaderboard', icon: '▲' },
    ],
  },
  {
    title: 'Content',
    links: [
      { href: '/content/articles', label: 'Articles', icon: '▤' },
      { href: '/content/events', label: 'Events', icon: '◷' },
    ],
  },
  {
    title: 'Support',
    links: [{ href: '/support/chat', label: 'Support chat', icon: '?' }],
  },
];

type NavLink = (typeof navSections)[number]['links'][number];

function readCollapsedSections(storageKey: string) {
  if (typeof window === 'undefined') return {} as Record<string, boolean>;
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { context, loading } = usePortalContext();
  const { staffFetch: fetchCounts } = useStaffApi();
  const [navOpen, setNavOpen] = useState(false);
  const [applicationCount, setApplicationCount] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsed(readCollapsedSections('portal-nav-collapsed'));
  }, []);

  function toggleSection(title: string) {
    setCollapsed((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      window.localStorage.setItem('portal-nav-collapsed', JSON.stringify(next));
      return next;
    });
  }

  function renderLink(link: NavLink) {
    const count =
      link.countKey === 'applications' && applicationCount !== null ? applicationCount : null;
    return (
      <Link
        key={link.href}
        href={link.href}
        className={isActive(pathname, link.href) ? 'portal-nav-active' : undefined}
        onClick={() => setNavOpen(false)}
      >
        <span className="portal-nav-icon" aria-hidden="true">
          {link.icon}
        </span>
        <span className="portal-nav-label">{link.label}</span>
        {count !== null && count > 0 ? (
          <span className="portal-nav-badge">{count}</span>
        ) : null}
      </Link>
    );
  }

  const universityName = context?.university.name ?? 'University portal';
  const logoUrl = context
    ? getUniversityLogoUrl(context.university.slug, context.university.logoUrl)
    : null;

  useEffect(() => {
    if (!context) return;
    fetchCounts<Array<{ id: string }>>('/applications/staff').then((rows) => {
      if (rows) setApplicationCount(rows.length);
    });
  }, [context, fetchCounts]);

  return (
    <div className="portal-shell">
      <header className="portal-mobile-header">
        <button
          type="button"
          className="portal-mobile-menu-btn"
          aria-expanded={navOpen}
          aria-controls="portal-sidebar-nav"
          onClick={() => setNavOpen((open) => !open)}
        >
          <span className="sr-only">{navOpen ? 'Close menu' : 'Open menu'}</span>
          {navOpen ? '✕' : '☰'}
        </button>
        <span className="portal-sidebar-uni-name">{universityName}</span>
        <UserButton afterSignOutUrl="/sign-in" />
      </header>

      <aside className={`portal-sidebar${navOpen ? ' portal-sidebar--open' : ''}`}>
        <div className="portal-sidebar-brand">
          {loading ? (
            <div className="portal-sidebar-loading">
              <Skeleton height="2.25rem" width="2.25rem" />
              <div className="portal-sidebar-loading-text">
                <Skeleton height="0.875rem" width="80%" />
                <Skeleton height="0.75rem" width="60%" />
              </div>
            </div>
          ) : (
            <>
              <div className="portal-sidebar-uni">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="portal-sidebar-logo" />
                ) : null}
                <span className="portal-sidebar-uni-name">{universityName}</span>
              </div>
              <span className="portal-sidebar-sub">
                {context?.staff.jobTitle ?? 'University staff portal'}
              </span>
            </>
          )}
        </div>
        {navSections.map((section, index) => {
          const isCollapsed = collapsed[section.title] ?? false;
          return (
            <div key={section.title} className="portal-nav-section">
              <button
                type="button"
                className="portal-nav-section-toggle"
                aria-expanded={!isCollapsed}
                onClick={() => toggleSection(section.title)}
              >
                <span>{section.title}</span>
                <span aria-hidden="true">{isCollapsed ? '▸' : '▾'}</span>
              </button>
              {!isCollapsed ? (
                <nav
                  id={index === 0 ? 'portal-sidebar-nav' : undefined}
                  className="portal-sidebar-nav"
                  aria-label={`${section.title} navigation`}
                >
                  {section.links.map(renderLink)}
                </nav>
              ) : null}
            </div>
          );
        })}
        <div className="portal-sidebar-footer">
          {context?.staff.email ? (
            <p className="portal-sidebar-email">{context.staff.email}</p>
          ) : null}
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </aside>
      <div className="portal-main">{children}</div>
    </div>
  );
}
