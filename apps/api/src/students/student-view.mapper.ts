import { ConsentScope } from '@faralin/db';
import { ProfileRevealLevel } from '@faralin/db';

export interface StudentProfileFields {
  anonymousId: string;
  revealLevel: ProfileRevealLevel | string;
  firstName?: string | null;
  lastName?: string | null;
  schoolName?: string | null;
  yearGroup?: number | null;
  subjectSlugs?: string[];
  assessmentsCompleted?: number;
  totalFaralins?: number;
  performanceBand?: string;
}

export interface StaffStudentView {
  anonymousId: string;
  revealLevel: string;
  subjectSlugs: string[];
  assessmentsCompleted: number;
  totalFaralins: number;
  performanceBand?: string;
  firstName?: string;
  lastName?: string;
  schoolName?: string;
  yearGroup?: number;
  visibleScopes?: string[];
}

export type ApplicationStageForVisibility =
  | 'FOLLOWER'
  | 'FARALIN_ACTIVE'
  | 'REFERRAL_CLICKED'
  | 'APPLIED'
  | 'OFFER_RECEIVED'
  | 'OFFER_ACCEPTED'
  | 'FIRM'
  | 'INSURANCE'
  | 'ENROLLED'
  | 'WITHDRAWN'
  | 'REJECTED'
  | string;

const OFFER_STAGES = new Set([
  'OFFER_RECEIVED',
  'OFFER_ACCEPTED',
  'FIRM',
  'INSURANCE',
  'ENROLLED',
]);

/**
 * Stage-gated staff visibility: FOLLOWER sees anonymous analytics only;
 * offer/enrol stages unlock additional fields when matching consents are granted.
 */
export function toStaffStudentView(
  profile: StudentProfileFields,
  options?: {
    applicationStatus?: ApplicationStageForVisibility;
    grantedScopes?: Array<ConsentScope | string>;
  },
): StaffStudentView {
  const level = String(profile.revealLevel);
  const applicationStatus = options?.applicationStatus ?? 'FOLLOWER';
  const granted = new Set((options?.grantedScopes ?? []).map(String));

  const base: StaffStudentView = {
    anonymousId: profile.anonymousId,
    revealLevel: level,
    subjectSlugs: [],
    assessmentsCompleted: 0,
    totalFaralins: 0,
    performanceBand: undefined,
    visibleScopes: ['ANONYMOUS_ANALYTICS'],
  };

  // FOLLOWER: anonymous analytics only (no PII beyond anonymousId)
  if (applicationStatus === 'FOLLOWER') {
    if (granted.has('ANONYMOUS_ANALYTICS') || granted.size === 0) {
      base.assessmentsCompleted = profile.assessmentsCompleted ?? 0;
      base.totalFaralins = profile.totalFaralins ?? 0;
      base.performanceBand = profile.performanceBand;
    }
    if (granted.has('ANONYMOUS_SKILL_PROFILE')) {
      base.subjectSlugs = profile.subjectSlugs ?? [];
      base.visibleScopes?.push('ANONYMOUS_SKILL_PROFILE');
    }
    return base;
  }

  base.assessmentsCompleted = profile.assessmentsCompleted ?? 0;
  base.totalFaralins = profile.totalFaralins ?? 0;
  base.performanceBand = profile.performanceBand;

  if (granted.has('ANONYMOUS_SKILL_PROFILE') || granted.has('SHARED_PORTFOLIO')) {
    base.subjectSlugs = profile.subjectSlugs ?? [];
    base.visibleScopes?.push('ANONYMOUS_SKILL_PROFILE');
  }

  if (granted.has('SHARED_PORTFOLIO') && (level === 'PARTIAL' || level === 'FULL')) {
    if (profile.schoolName) base.schoolName = profile.schoolName;
    if (profile.yearGroup != null) base.yearGroup = profile.yearGroup;
    base.visibleScopes?.push('SHARED_PORTFOLIO');
  }

  if (
    granted.has('APPLICATION_EVIDENCE') &&
    (applicationStatus === 'APPLIED' || OFFER_STAGES.has(applicationStatus))
  ) {
    if (level === 'FULL' || level === 'PARTIAL') {
      if (profile.schoolName) base.schoolName = profile.schoolName;
      if (profile.yearGroup != null) base.yearGroup = profile.yearGroup;
    }
    base.visibleScopes?.push('APPLICATION_EVIDENCE');
  }

  if (granted.has('OFFER_VERIFICATION') && OFFER_STAGES.has(applicationStatus)) {
    if (level === 'FULL') {
      if (profile.firstName) base.firstName = profile.firstName;
      if (profile.lastName) base.lastName = profile.lastName;
    }
    base.visibleScopes?.push('OFFER_VERIFICATION');
  }

  if (granted.has('ENROLMENT_RECONCILIATION') && applicationStatus === 'ENROLLED') {
    if (level === 'FULL') {
      if (profile.firstName) base.firstName = profile.firstName;
      if (profile.lastName) base.lastName = profile.lastName;
    }
    base.visibleScopes?.push('ENROLMENT_RECONCILIATION');
  }

  // Legacy revealLevel fallback when no consents recorded yet
  if (granted.size === 0) {
    if (level === 'PARTIAL' || level === 'FULL') {
      if (profile.schoolName) base.schoolName = profile.schoolName;
      if (profile.yearGroup != null) base.yearGroup = profile.yearGroup;
      base.subjectSlugs = profile.subjectSlugs ?? [];
    }
    if (level === 'FULL' && OFFER_STAGES.has(applicationStatus)) {
      if (profile.firstName) base.firstName = profile.firstName;
      if (profile.lastName) base.lastName = profile.lastName;
    }
  }

  return base;
}

export function displayStudentLabel(view: StaffStudentView): string {
  if (view.firstName || view.lastName) {
    return [view.firstName, view.lastName].filter(Boolean).join(' ') || view.anonymousId;
  }
  return view.anonymousId;
}
