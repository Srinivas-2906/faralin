import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

function getPublishableKey() {
  return (
    process.env.CLERK_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    ''
  );
}

const publishableKey = getPublishableKey();
const hasClerk =
  publishableKey.length > 0 && !publishableKey.includes('placeholder');

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/api(.*)']);

export default hasClerk
  ? clerkMiddleware(
      async (auth, request) => {
        if (!isPublicRoute(request)) {
          await auth.protect();
        }
      },
      () => ({ publishableKey }),
    )
  : () => NextResponse.next();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
