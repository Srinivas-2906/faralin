'use client';

import { useUser } from '@clerk/nextjs';
import { BrandLogo } from './brand-logo';
import { homeNavLinks, MobileNav, useNavLinksForRoute } from './mobile-nav';
import { NavAuthTrailing } from './nav-auth-trailing';
import { SiteHeaderShell } from './site-header-shell';

export function NavClerk() {
  const { user } = useUser();
  const isStaff = user?.publicMetadata?.role === 'UNIVERSITY_STAFF';
  const links = useNavLinksForRoute(isStaff);

  return (
    <SiteHeaderShell>
      <div className="container">
        <MobileNav
          brand={<BrandLogo />}
          links={links}
          trailing={<NavAuthTrailing />}
        />
      </div>
    </SiteHeaderShell>
  );
}
