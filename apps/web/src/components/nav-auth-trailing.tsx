'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { authAppearance } from '@/lib/clerk-appearance';

export function NavAuthTrailing() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="nav-auth-actions" aria-hidden="true" />;
  }

  return (
    <div className="nav-auth-actions">
      <SignedIn>
        <UserButton afterSignOutUrl="/" appearance={authAppearance} />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal" appearance={authAppearance}>
          <button type="button" className="nav-sign-in">
            Sign in
          </button>
        </SignInButton>
        <Link href="/sign-up" className="nav-get-started btn btn-copper">
          Get started
        </Link>
      </SignedOut>
    </div>
  );
}

export function DemoNavTrailing() {
  return (
    <div className="nav-auth-actions">
      <Link href="/sign-in" className="nav-sign-in">
        Sign in
      </Link>
      <Link href="/sign-up" className="nav-get-started btn btn-copper">
        Get started
      </Link>
    </div>
  );
}
