export const TRUST_LEVEL_LABELS = {
  PRACTICE: 'Practice recognition',
  VERIFIED: 'Verified recognition',
  PARTNER_VERIFIED: 'Partner-verified recognition',
} as const;

export const APPLICATION_STATUS_LABELS = {
  FOLLOWER: 'Following',
  REFERRAL_CLICKED: 'Application link opened',
  APPLIED: 'Applied',
  OFFER_RECEIVED: 'Offer received',
  OFFER_ACCEPTED: 'Offer accepted',
  ENROLLED: 'Enrolled',
  WITHDRAWN: 'Withdrawn',
  REJECTED: 'Not successful',
} as const;

export const DIFFICULTY_LABELS = {
  FOUNDATION: 'Foundation',
  STANDARD: 'Standard',
  ADVANCED: 'Advanced',
} as const;

export const ARTICLE_TYPE_LABELS = {
  NEWS: 'News',
  BLOG: 'Blog',
  SCHOLARSHIP: 'Scholarship',
  ADVICE: 'Advice',
  STUDENT_STORY: 'Student story',
  COURSE_GUIDE: 'Course guide',
  CHALLENGE_BRIEF: 'Challenge brief',
} as const;

export const COURSE_LEVEL_LABELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
} as const;

export const EVENT_TYPE_LABELS = {
  WEBINAR: 'Webinar',
  OPEN_DAY: 'Open day',
  TASTER: 'Taster session',
  CHALLENGE: 'Challenge',
} as const;

export const MAX_UNIVERSITY_SELECTIONS = 10;

export interface PortfolioSummary {
  totalFaralins: number;
  faralinsThisMonth: number;
  assessmentsCompleted: number;
  estimatedBursaryGbp: number;
  byUniversity: UniversityBalance[];
}

export interface UniversityBalance {
  universityId: string;
  universityName: string;
  universitySlug: string;
  totalFaralins: number;
  verifiedFaralins: number;
  estimatedBursaryGbp: number;
  disclaimer: string;
}

export interface AnonymousStudentView {
  anonymousId: string;
  revealLevel: string;
  subjectSlugs: string[];
  assessmentsCompleted: number;
  totalFaralins: number;
  performanceBand: 'developing' | 'steady' | 'strong' | 'exceptional';
}

export interface UniversityFunnelStats {
  followers: number;
  referralClicked: number;
  applied: number;
  offerReceived: number;
  offerAccepted: number;
  enrolled: number;
}
