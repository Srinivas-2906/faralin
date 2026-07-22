'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { useState } from 'react';
import { usePortalContext } from '@/lib/use-portal-data';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/students', label: 'Students' },
  { href: '/applications', label: 'Applications' },
  { href: '/content/articles', label: 'Articles' },
  { href: '/content/events', label: 'Events' },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { context } = usePortalContext();
  const [navOpen, setNavOpen] = useState(false);

  const universityName = context?.university.name ?? 'University portal';
  const logoUrl = context?.university.logoUrl;

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
        </div>
        <nav
          id="portal-sidebar-nav"
          className="portal-sidebar-nav"
          aria-label="Portal navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(pathname, link.href) ? 'portal-nav-active' : undefined}
              onClick={() => setNavOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="portal-sidebar-footer">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </aside>
      <div className="portal-main">{children}</div>
    </div>
  );
}
