import type { ReactNode } from 'react';

interface ContentRailProps {
  children: ReactNode;
  ariaLabel?: string;
}

export function ContentRail({ children, ariaLabel = 'Scrollable content' }: ContentRailProps) {
  return (
    <div className="content-rail" role="region" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

export function ContentRailItem({ children }: { children: ReactNode }) {
  return <div className="content-rail-item">{children}</div>;
}
