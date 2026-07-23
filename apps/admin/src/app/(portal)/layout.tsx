import { AdminProvider } from '@/components/admin-provider';
import { AdminShell } from '@/components/admin-shell';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>
        <main id="main-content" className="page-main">
          {children}
        </main>
      </AdminShell>
    </AdminProvider>
  );
}
