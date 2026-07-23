export type AssessmentLockState = 'AVAILABLE' | 'LOCKED' | 'COMPLETED';

export type StudentRecognitionTier = 'EXPLORER' | 'BUILDER' | 'ACHIEVER' | 'CHAMPION';

export const RECOGNITION_TIER_LABELS: Record<StudentRecognitionTier, string> = {
  EXPLORER: 'Explorer',
  BUILDER: 'Builder',
  ACHIEVER: 'Achiever',
  CHAMPION: 'Champion',
};

export const RECOGNITION_TIER_ORDER: StudentRecognitionTier[] = [
  'EXPLORER',
  'BUILDER',
  'ACHIEVER',
  'CHAMPION',
];

export interface AssessmentSeriesLevel {
  id: string;
  slug: string;
  title: string;
  levelOrder: number;
  levelLabel: string;
  enabled: boolean;
  unlocksAfterAssessmentId: string | null;
}

export interface AssessmentSeriesGroup {
  seriesSlug: string;
  title: string;
  levels: AssessmentSeriesLevel[];
}

export interface JourneyMilestone {
  trackSlug: string;
  sortOrder: number;
  label: string;
  bonusFaralins?: number;
  badgeLabel?: string;
}

export interface ProblemTrackJourneyDto {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  milestones: JourneyMilestone[];
}
