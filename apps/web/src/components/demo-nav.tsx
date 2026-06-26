'use client';

import { usePathname } from 'next/navigation';
import { BrandLogo } from './brand-logo';
import { homeNavLinks, MobileNav } from './mobile-nav';
import { DemoNavTrailing } from './nav-auth-trailing';
import { SiteHeaderShell } from './site-header-shell';

const demoLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/assessments', label: 'Assessments' },
  { href: '/universities', label: 'Universities' },
];

export function DemoNav() {
  const pathname = usePathname();
  const links = pathname === '/' ? homeNavLinks : demoLinks;

  return (
    <SiteHeaderShell>
      <div className="container">
        <MobileNav
          brand={<BrandLogo />}
          links={links}
          trailing={<DemoNavTrailing />}
        />
      </div>
    </SiteHeaderShell>
  );
}
