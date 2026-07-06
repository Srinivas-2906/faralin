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

export const TRACK_DIFFICULTY_LABELS = {
  FOUNDATION: 'Foundation Track',
  CORE: 'Core Track',
  ADVANCED: 'Advanced Track',
  SCHOLAR: 'Scholar Track',
  FELLOWSHIP: 'Fellowship Track',
} as const;

export const PROBLEM_SECTION_TYPE_LABELS = {
  ORIENTATION: 'Orientation',
  STORY: 'Story',
  CORE_QUESTION: 'Core question',
  LEARN: 'Learn',
  PRACTICE: 'Practice',
  SOLVE: 'Solve',
  PERSONALISE: 'Personal application',
  REFLECT: 'Reflection',
  FINAL_BUILDER: 'Final builder',
  REVIEW: 'Review',
  SUBMIT: 'Submit',
} as const;

export const SUBMISSION_TRUST_LABELS = {
  HIGH: 'High trust',
  MEDIUM: 'Medium trust',
  LOW: 'Low trust',
} as const;

export type ProblemSectionType =
  | 'ORIENTATION'
  | 'STORY'
  | 'CORE_QUESTION'
  | 'LEARN'
  | 'PRACTICE'
  | 'SOLVE'
  | 'PERSONALISE'
  | 'REFLECT'
  | 'FINAL_BUILDER'
  | 'REVIEW'
  | 'SUBMIT';

export type InputFieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'table'
  | 'equation'
  | 'diagram'
  | 'upload'
  | 'multiple_choice'
  | 'code';

export interface ProblemTrackInputField {
  id: string;
  label: string;
  type: InputFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validationRules?: Record<string, unknown>;
}

export interface ProblemTrackSection {
  id: string;
  type: ProblemSectionType;
  title: string;
  content: string;
  inputs: ProblemTrackInputField[];
  aiPolicy: {
    allowed: string[];
    forbidden: string[];
  };
  unlockRules?: { requiresSectionId?: string }[];
}

export interface RubricCategory {
  name: string;
  weight: number;
  descriptors: {
    excellent: string;
    strong: string;
    developing: string;
    weak: string;
  };
}

export interface AwardBand {
  minScore: number;
  percentOfMax: number;
  label: string;
}

export interface PortfolioSummary {
  totalFaralins: number;
  faralinsThisMonth: number;
  assessmentsCompleted: number;
  tracksCompleted: number;
  estimatedBursaryGbp: number;
  byUniversity: UniversityBalance[];
}

export interface PortfolioArtifactSummary {
  id: string;
  title: string;
  slug: string;
  subjectName: string;
  difficultyBand: string;
  rubricScore: number;
  faralinsEarned: number;
  skillsDemonstrated: string[];
  trustLevel: string;
  moderationStatus: string;
  completedAt: string;
}

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
