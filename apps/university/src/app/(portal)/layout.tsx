import { PortalProvider } from '@/components/portal-provider';
import { PortalShell } from '@/components/portal-shell';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      <PortalShell>
        <main id="main-content" className="page-main">
          {children}
        </main>
      </PortalShell>
    </PortalProvider>
  );
}
