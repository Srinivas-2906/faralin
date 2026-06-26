'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface NavLink {
  href: string;
  label: string;
  accent?: boolean;
}

interface MobileNavProps {
  links: NavLink[];
  brand?: React.ReactNode;
  trailing?: React.ReactNode;
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav({ links, brand, trailing }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('keydown', handleKeyDown);
    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  const linkClass = (href: string, accent?: boolean) => {
    const active = isActive(pathname, href);
    return [active ? 'nav-active' : '', accent ? 'nav-accent' : ''].filter(Boolean).join(' ');
  };

  return (
    <>
      <div className="site-header-inner">
        <div className="site-header-brand">{brand}</div>
        <nav className="site-nav desktop-only" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.href, link.accent)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {trailing && <div className="site-header-trailing desktop-only">{trailing}</div>}
        <button
          ref={toggleRef}
          type="button"
          className={`nav-toggle mobile-only${open ? ' nav-toggle-open' : ''}`}
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav-toggle-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {open && (
        <>
          <div className="nav-drawer-overlay" onClick={close} aria-hidden="true" />
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            className="nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="nav-drawer-header">
              <span className="brand">Menu</span>
              <button
                type="button"
                className="nav-drawer-close"
                onClick={close}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass(link.href, link.accent)}
                onClick={close}
              >
                {link.label}
              </Link>
            ))}
            {trailing && <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>{trailing}</div>}
          </div>
        </>
      )}
    </>
  );
}

export const homeNavLinks: NavLink[] = [
  { href: '/foundation', label: 'Faralin Foundation' },
  { href: '/knowledge-center', label: 'Knowledge Center' },
];

export function useNavLinks(isStaff: boolean): NavLink[] {
  const base: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/assessments', label: 'Assessments' },
    { href: '/universities', label: 'Universities' },
  ];
  if (isStaff) {
    base.push({ href: '/university', label: 'University portal', accent: true });
  }
  return base;
}

export function useNavLinksForRoute(isStaff: boolean): NavLink[] {
  const pathname = usePathname();
  if (pathname === '/') return homeNavLinks;
  return useNavLinks(isStaff);
}
