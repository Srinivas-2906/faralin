export type AssessmentDifficulty = 'FOUNDATION' | 'STANDARD' | 'ADVANCED';

export type AchievementActivityType =
  | 'ASSESSMENT'
  | 'PROBLEM_TRACK'
  | 'PROBLEM_TRACK_SECTION'
  | 'JOURNEY_MILESTONE';

export type AchievementVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type UniversityProjectionStatus = 'ESTIMATE';

export interface UniversityProjectionSummary {
  universityId: string;
  universityName: string;
  universitySlug: string;
  eligibleCoreFaralins: number;
  estimatedAwardGbp: number;
  universityBoost: number;
  subjectAlignmentBoost: number;
  verificationBoost: number;
  perStudentCapGbp: number | null;
  campaignId?: string | null;
  campaignName?: string | null;
  status: UniversityProjectionStatus;
  disclaimer: string;
}
