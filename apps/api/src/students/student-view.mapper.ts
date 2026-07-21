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
}

export function toStaffStudentView(profile: StudentProfileFields): StaffStudentView {
  const level = String(profile.revealLevel);
  const base: StaffStudentView = {
    anonymousId: profile.anonymousId,
    revealLevel: level,
    subjectSlugs: profile.subjectSlugs ?? [],
    assessmentsCompleted: profile.assessmentsCompleted ?? 0,
    totalFaralins: profile.totalFaralins ?? 0,
    performanceBand: profile.performanceBand,
  };

  if (level === 'PARTIAL' || level === 'FULL') {
    if (profile.schoolName) base.schoolName = profile.schoolName;
    if (profile.yearGroup != null) base.yearGroup = profile.yearGroup;
  }

  if (level === 'FULL') {
    if (profile.firstName) base.firstName = profile.firstName;
    if (profile.lastName) base.lastName = profile.lastName;
  }

  return base;
}

export function displayStudentLabel(view: StaffStudentView): string {
  if (view.firstName || view.lastName) {
    return [view.firstName, view.lastName].filter(Boolean).join(' ') || view.anonymousId;
  }
  return view.anonymousId;
}
