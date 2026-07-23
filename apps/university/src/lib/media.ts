const WEB_URL =
  process.env.NEXT_PUBLIC_WEB_URL ??
  process.env.NEXT_PUBLIC_STUDENT_WEB_URL ??
  'https://faralin.kaana.in';

export function resolveMediaUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${WEB_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function studentUniversityUrl(slug: string) {
  return `${WEB_URL.replace(/\/$/, '')}/universities/${slug}`;
}

export function getUniversityLogoUrl(slug: string, logoUrl?: string | null) {
  const mapped = `/images/universities/${slug}.jpg`;
  return resolveMediaUrl(logoUrl?.startsWith('http') ? logoUrl : mapped) ?? resolveMediaUrl(mapped);
}
