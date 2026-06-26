'use client';

import { DemoNav } from './demo-nav';
import { NavClerk } from './nav-clerk';

const hasClerk =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'string' &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder');

export function Nav() {
  if (!hasClerk) {
    return <DemoNav />;
  }

  return <NavClerk />;
}
