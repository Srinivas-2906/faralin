'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { authAppearance, authLocalization } from '@/lib/clerk-appearance';

export function AuthProvider({
  children,
  publishableKey,
}: {
  children: React.ReactNode;
  publishableKey: string;
}) {
  if (!publishableKey || publishableKey.includes('placeholder')) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={authAppearance}
      localization={authLocalization}
    >
      {children}
    </ClerkProvider>
  );
}
