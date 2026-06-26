'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { authAppearance, authLocalization } from '@/lib/clerk-appearance';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey || publishableKey.includes('placeholder')) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={authAppearance}
      localization={authLocalization}
    >
      {children}
    </ClerkProvider>
  );
}
