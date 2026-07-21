'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

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

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="portal-sidebar-brand">
          <span className="brand">Faralin</span>
          <span className="portal-sidebar-sub">University portal</span>
        </div>
        <nav className="portal-sidebar-nav" aria-label="Portal navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(pathname, link.href) ? 'portal-nav-active' : undefined}
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
