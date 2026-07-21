import { PortalShell } from '@/components/portal-shell';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell>
      <main id="main-content" className="page-main">
        {children}
      </main>
    </PortalShell>
  );
}
