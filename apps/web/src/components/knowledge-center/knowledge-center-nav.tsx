'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: '/knowledge-center', label: 'Overview', exact: true },
  { href: '/knowledge-center/blogs', label: 'Blogs' },
  { href: '/knowledge-center/news', label: 'News' },
  { href: '/knowledge-center/courses', label: 'Courses' },
  { href: '/knowledge-center/resources', label: 'Resources' },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function KnowledgeCenterNav() {
  const pathname = usePathname();

  return (
    <nav className="knowledge-center-nav" aria-label="Knowledge Center">
      <div className="container-wide knowledge-center-nav-inner">
        <p className="knowledge-center-nav-brand">Knowledge Center</p>
        <ul className="knowledge-center-nav-list">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`knowledge-center-nav-link${
                  isActive(pathname, link.href, link.exact) ? ' is-active' : ''
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
