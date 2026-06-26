import type { Metadata } from 'next';
import { Raleway, Roboto } from 'next/font/google';
import '@faralin/ui/globals.css';
import '@faralin/ui/auth-overrides.css';
import { AuthProvider } from '@/components/auth-provider';
import { Nav } from '@/components/nav';
import { SiteFooter } from '@/components/site-footer';

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
  title: 'Faralin — University-backed student recognition',
  description:
    'Earn university-specific Faralins through assessments. Recognition converts to conditional bursary value if you are admitted and enrol.',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${raleway.variable} ${roboto.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthProvider>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <Nav />
          <main id="main-content" className="page-main" style={{ flex: 1 }}>
            {children}
          </main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
