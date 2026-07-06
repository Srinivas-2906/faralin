'use client';

import { DemoNav } from './demo-nav';
import { NavClerk } from './nav-clerk';

export function Nav({ hasClerk }: { hasClerk: boolean }) {
  if (!hasClerk) {
    return <DemoNav />;
  }

  return <NavClerk />;
}
