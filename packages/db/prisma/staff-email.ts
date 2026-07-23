export const STAFF_EMAIL_DOMAIN = 'faralin.kaana.in';

export function staffEmailForSlug(slug: string) {
  return `staff-${slug}@${STAFF_EMAIL_DOMAIN}`;
}

export function legacyStaffEmailForSlug(slug: string) {
  return `staff@${slug}.demo`;
}
