'use client';

import { BrandLogo } from './brand-logo';
import { homeNavLinks, MobileNav, useNavLinksForRoute } from './mobile-nav';
import { NavAuthTrailing } from './nav-auth-trailing';
import { SiteHeaderShell } from './site-header-shell';

export function NavClerk() {
  const links = useNavLinksForRoute();

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
