/**
 * Central image paths — swap URLs here when you add brand assets to public/images/.
 */

const FALLBACK_CAMPUS = '/images/fallback-campus.jpg';
const UNIVERSITIES_BANNER = '/images/universitybanner.webp';
const FALLBACK_HERO = '/images/hero.jpg';
const FALLBACK_AUTH = '/images/auth-panel.jpg';
const FALLBACK_PORTFOLIO = '/images/portfolio-band.jpg';
const LOGO = '/images/logo.png';

const UNIVERSITY_IMAGES: Record<string, string> = {
  oxford: '/images/universities/oxford.jpg',
  cambridge: '/images/universities/cambridge.jpg',
  imperial: '/images/universities/imperial.jpg',
  ucl: '/images/universities/ucl.jpg',
  'kings-college-london': '/images/universities/kings-college-london.jpg',
  lse: '/images/universities/lse.jpg',
  edinburgh: '/images/universities/edinburgh.jpg',
  durham: '/images/universities/durham.jpg',
  warwick: '/images/universities/warwick.jpg',
  southampton: '/images/universities/southampton.jpg',
  manchester: '/images/universities/manchester.jpg',
  bristol: '/images/universities/bristol.jpg',
  leeds: '/images/universities/leeds.jpg',
  birmingham: '/images/universities/birmingham.jpg',
  nottingham: '/images/universities/nottingham.jpg',
  sheffield: '/images/universities/sheffield.jpg',
  newcastle: '/images/universities/newcastle.jpg',
  cardiff: '/images/universities/cardiff.jpg',
  bath: '/images/universities/bath.jpg',
  exeter: '/images/universities/exeter.jpg',
};

const HOME_SPOTLIGHT_UNIVERSITY_IMAGES: Record<string, string> = {
  oxford: '/images/universities-banner.jpg',
  manchester: '/images/universities/imperial.jpg',
  bristol: '/images/universities/ucl.jpg',
  southampton: '/images/universities/bath.jpg',
  exeter: '/images/universities/warwick.jpg',
};

const SUBJECT_IMAGES: Record<string, string> = {
  mathematics: '/images/subjects/mathematics.jpg',
  physics: '/images/subjects/physics.jpg',
  biology: '/images/subjects/biology.jpg',
  chemistry: '/images/subjects/chemistry.jpg',
  english: '/images/subjects/english.jpg',
  history: '/images/subjects/history.jpg',
  economics: '/images/subjects/economics.jpg',
  'computer-science': '/images/subjects/computer-science.jpg',
  psychology: '/images/subjects/psychology.jpg',
  geography: '/images/subjects/geography.jpg',
};

export function getHeroImage() {
  return FALLBACK_HERO;
}

export function getUniversitiesBannerImage() {
  return UNIVERSITIES_BANNER;
}

export function getAuthPanelImage() {
  return FALLBACK_AUTH;
}

export function getPortfolioBandImage() {
  return FALLBACK_PORTFOLIO;
}

export function getLogoImage() {
  return LOGO;
}

export function getUniversityImage(slug: string, logoUrl?: string | null) {
  const mapped = UNIVERSITY_IMAGES[slug];
  if (mapped) return mapped;
  if (logoUrl?.startsWith('http')) return logoUrl;
  return FALLBACK_CAMPUS;
}

export function getHomeSpotlightUniversityImage(slug: string) {
  return HOME_SPOTLIGHT_UNIVERSITY_IMAGES[slug] ?? getUniversityImage(slug);
}

export function getSubjectImage(slug: string) {
  return SUBJECT_IMAGES[slug] ?? FALLBACK_CAMPUS;
}

export function getAssessmentImage(assessmentSlug: string, _subjectSlug: string) {
  return `/images/assessments/${assessmentSlug}.jpg`;
}

export function getAssessmentImageFallback(subjectSlug: string) {
  return getSubjectImage(subjectSlug);
}

/** Use university image as article/event cover fallback */
export function getArticleCoverImage(universitySlug: string, logoUrl?: string | null) {
  return getUniversityImage(universitySlug, logoUrl);
}
