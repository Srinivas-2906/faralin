import type { Metadata } from 'next';
import { Raleway, Roboto } from 'next/font/google';
import '@faralin/ui/globals.css';
import '@faralin/ui/auth-overrides.css';
import { AuthProvider } from '@/components/auth-provider';

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
});

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '700'],
});
export const metadata: Metadata = {
  title: 'Faralin Admin',
  description: 'Manage assessments, Faralin rules, and universities.',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${raleway.variable} ${roboto.variable}`}>      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthProvider>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <header className="site-header">
            <div className="container">
              <div className="site-header-inner">
                <span className="brand">Faralin Admin</span>
                <a
                  href={process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'}
                  className="desktop-only"
                  style={{ color: 'var(--faralin-muted)', fontWeight: 500 }}
                >
                  Back to student app
                </a>
              </div>
            </div>
          </header>
          <main id="main-content" className="page-main" style={{ flex: 1 }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
