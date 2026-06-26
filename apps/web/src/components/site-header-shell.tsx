'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface SiteHeaderShellProps {
  children: ReactNode;
}

export function SiteHeaderShell({ children }: SiteHeaderShellProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
      {children}
    </header>
  );
}
