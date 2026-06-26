import type { User } from '@clerk/nextjs/server';

function formatEmailLocalPart(email: string): string {
  const local = email.split('@')[0] ?? '';

  return local
    .replace(/[._+-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

type ProfileName = {
  firstName?: string | null;
  lastName?: string | null;
};

export function getUserDisplayName(
  user: User | null,
  profile?: ProfileName | null,
): string {
  const clerkName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  if (clerkName) return clerkName;

  if (user?.fullName?.trim()) return user.fullName.trim();

  const profileName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
  if (profileName) return profileName;

  const email =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;

  if (email) {
    const fromEmail = formatEmailLocalPart(email);
    if (fromEmail) return fromEmail;
  }

  return 'there';
}
