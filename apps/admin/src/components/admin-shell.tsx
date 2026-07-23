'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Skeleton } from '@faralin/ui';
import { useAdminContext } from '@/components/admin-provider';
import { useAdminApi } from '@/lib/use-admin-api';

type NavLink = {
  href: string;
  label: string;
  icon: string;
  countKey?: 'open' | 'mine' | 'live';
};

const supportNav: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '◉' },
  { href: '/live', label: 'Live inbox', icon: '◔', countKey: 'live' as const },
  { href: '/tickets', label: 'All tickets', icon: '☰', countKey: 'open' as const },
  { href: '/tickets/queue', label: 'My queue', icon: '◎', countKey: 'mine' as const },
  { href: '/tickets/new', label: 'New ticket', icon: '＋' },
];

const platformNav: NavLink[] = [
  { href: '/platform/assessments', label: 'Assessments', icon: '▤' },
  { href: '/platform/rules', label: 'Faralin rules', icon: '◈' },
  { href: '/platform/universities', label: 'Universities', icon: '◷' },
  { href: '/platform/problem-tracks', label: 'Problem tracks', icon: '▥' },
  { href: '/platform/moderation', label: 'Moderation', icon: '◐' },
  { href: '/platform/staff', label: 'Staff invites', icon: '◌' },
  { href: '/platform/agents', label: 'Support agents', icon: '◎' },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { context, loading } = useAdminContext();
  const { adminFetch } = useAdminApi();
  const [navOpen, setNavOpen] = useState(false);
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [mineCount, setMineCount] = useState<number | null>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);

  useEffect(() => {
    if (!context) return;
    adminFetch<{ open: number; myAssigned: number }>('/support/dashboard').then((stats) => {
      if (stats) {
        setOpenCount(stats.open);
        setMineCount(stats.myAssigned);
      }
    });
    adminFetch<Array<{ id: string }>>('/support/live').then((rows) => {
      if (rows) setLiveCount(rows.length);
    });
  }, [context, adminFetch, pathname]);

  const displayName =
    context?.agent?.displayName ??
    (context?.isAdmin ? 'Platform admin' : context?.user.email ?? 'Faralin admin');

  const navSections = [
    { title: 'Support', links: supportNav },
    ...(context?.isAdmin ? [{ title: 'Platform', links: platformNav }] : []),
  ];

  return (
    <div className="admin-shell">
      <header className="admin-mobile-header">
        <button
          type="button"
          className="admin-mobile-menu-btn"
          aria-expanded={navOpen}
          aria-controls="admin-sidebar-nav"
          onClick={() => setNavOpen((open) => !open)}
        >
          <span className="sr-only">{navOpen ? 'Close menu' : 'Open menu'}</span>
          {navOpen ? '✕' : '☰'}
        </button>
        <span className="admin-sidebar-uni-name">Faralin Admin</span>
        <UserButton afterSignOutUrl="/sign-in" />
      </header>

      <aside className={`admin-sidebar${navOpen ? ' admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar-brand">
          {loading ? (
            <div className="admin-sidebar-loading">
              <Skeleton height="2.25rem" width="2.25rem" />
              <div className="admin-sidebar-loading-text">
                <Skeleton height="0.875rem" width="80%" />
                <Skeleton height="0.75rem" width="60%" />
              </div>
            </div>
          ) : (
            <>
              <div className="admin-sidebar-uni">
                <span className="admin-sidebar-uni-name">Faralin Admin</span>
              </div>
              <span className="admin-sidebar-sub">{displayName}</span>
            </>
          )}
        </div>

        {navSections.map((section) => (
          <div key={section.title} style={{ marginBottom: '1rem' }}>
            <p
              style={{
                fontSize: '0.6875rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--faralin-muted)',
                padding: '0 0.75rem 0.375rem',
              }}
            >
              {section.title}
            </p>
            <nav
              id={section.title === 'Support' ? 'admin-sidebar-nav' : undefined}
              className="admin-sidebar-nav"
              aria-label={`${section.title} navigation`}
            >
              {section.links.map((link) => {
                const count =
                  link.countKey === 'open' && openCount !== null
                    ? openCount
                    : link.countKey === 'mine' && mineCount !== null
                      ? mineCount
                      : link.countKey === 'live' && liveCount !== null
                        ? liveCount
                        : null;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={isActive(pathname, link.href) ? 'admin-nav-active' : undefined}
                    onClick={() => setNavOpen(false)}
                  >
                    <span className="admin-nav-icon" aria-hidden="true">
                      {link.icon}
                    </span>
                    <span className="admin-nav-label">{link.label}</span>
                    {count !== null && count > 0 ? (
                      <span className="admin-nav-badge">{count}</span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}

        <div className="admin-sidebar-footer">
          {context?.user.email ? (
            <p className="admin-sidebar-email">{context.user.email}</p>
          ) : null}
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
