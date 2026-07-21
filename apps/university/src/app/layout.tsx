import type { Metadata } from 'next';
import { Raleway, Roboto } from 'next/font/google';
import '@faralin/ui/globals.css';
import '@faralin/ui/auth-overrides.css';
import './portal.css';
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
  title: 'Faralin University Portal',
  description: 'University staff dashboard — anonymous student insights and admissions pipeline.',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey =
    process.env.CLERK_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    '';

  return (
    <html lang="en" className={`${raleway.variable} ${roboto.variable}`}>
      <body>
        <AuthProvider publishableKey={publishableKey}>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
